import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { getProductStats } from "@/lib/admin/products";
import { complaintStats } from "@/lib/complaints";

/**
 * Ringkasan dashboard admin. "Status pesanan" diturunkan dari dokumen yang
 * sudah terbit tiap penawaran (SP→dikonfirmasi, SJ→dikirim, BAST→serah terima,
 * KW→selesai), digabung pesanan checkout online.
 */

export type StatusBucket = { count: number; total: number };

export type DashboardData = {
  status: {
    menungguKonfirmasi: StatusBucket;
    dikonfirmasi: StatusBucket;
    dikirim: StatusBucket;
    sudahBast: StatusBucket;
    selesai: StatusBucket;
    komplain: StatusBucket;
  };
  produk: { aktif: number; hampirHabis: number; habis: number; total: number };
  tindakan: { pesananBaru: number; negosiasi: number; komplain: number };
  rating: { avg: number | null; count: number };
  updatedAt: string;
};

const LOW = 5;

export async function getDashboard(): Promise<DashboardData> {
  const sb = getAdminSupabase();
  const [prod, comp] = await Promise.all([getProductStats(LOW), complaintStats()]);

  const kosong = (): StatusBucket => ({ count: 0, total: 0 });
  const status = {
    menungguKonfirmasi: kosong(),
    dikonfirmasi: kosong(),
    dikirim: kosong(),
    sudahBast: kosong(),
    selesai: kosong(),
    komplain: { count: comp.open + comp.handling, total: 0 },
  };
  let pesananBaru = 0;
  let negosiasi = 0;

  if (sb) {
    // Dokumen (tahap) + total dari Surat Pesanan per penawaran.
    const { data: docs } = await sb
      .from("documents")
      .select("request_id, doc_type, snapshot")
      .is("voided_at", null);

    const perReq = new Map<string, { jenis: Set<string>; total: number }>();
    for (const d of (docs ?? []) as {
      request_id: string | null;
      doc_type: string;
      snapshot: { total?: number } | null;
    }[]) {
      if (!d.request_id) continue;
      const e = perReq.get(d.request_id) ?? { jenis: new Set<string>(), total: 0 };
      e.jenis.add(d.doc_type);
      if (d.doc_type === "SP") e.total = d.snapshot?.total ?? 0;
      perReq.set(d.request_id, e);
    }

    for (const { jenis, total } of perReq.values()) {
      if (!jenis.has("SP")) continue; // baru jadi pesanan setelah SP terbit
      let b: StatusBucket;
      if (jenis.has("KW")) b = status.selesai;
      else if (jenis.has("BAST")) b = status.sudahBast;
      else if (jenis.has("SJ")) b = status.dikirim;
      else b = status.dikonfirmasi;
      b.count += 1;
      b.total += total;
    }

    // Butuh tindakan dari penawaran.
    const { data: reqs } = await sb.from("quote_requests").select("status");
    for (const r of (reqs ?? []) as { status: string }[]) {
      if (r.status === "pending") pesananBaru += 1;
      if (r.status === "negotiating") negosiasi += 1;
    }

    // Pesanan online yang menunggu pembayaran.
    const { data: ord } = await sb.from("orders").select("status, total");
    for (const o of (ord ?? []) as { status: string; total: number }[]) {
      if (o.status === "pending") {
        status.menungguKonfirmasi.count += 1;
        status.menungguKonfirmasi.total += o.total;
      } else if (o.status === "paid" || o.status === "done") {
        status.selesai.count += 1;
        status.selesai.total += o.total;
      }
    }
  }

  return {
    status,
    produk: {
      aktif: prod.active,
      hampirHabis: prod.lowStock,
      habis: prod.outOfStock,
      total: prod.total,
    },
    tindakan: { pesananBaru, negosiasi, komplain: comp.open },
    rating: { avg: comp.avgRating, count: comp.ratingCount },
    updatedAt: new Date().toISOString(),
  };
}
