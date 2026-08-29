import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/** Ringkasan pesanan untuk tabel admin. */
export type OrderSummary = {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  buyerName: string;
  buyerInstitution: string | null;
  itemCount: number;
};

/**
 * Pesanan PENGADAAN: permintaan penawaran yang sudah terbit Surat Pesanan (SP).
 * Begitu SP terbit, penawaran itu efektif menjadi pesanan resmi — tapi ia hidup
 * di jalur Penawaran, bukan tabel `orders` (yang khusus checkout online). Fungsi
 * ini menariknya supaya keduanya tampil di satu tempat.
 */
export async function listProcurementOrders(limit = 100): Promise<
  (OrderSummary & { requestId: string; jenis: "pengadaan" })[]
> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("documents")
    .select("request_id, number, issued_at, snapshot")
    .eq("doc_type", "SP")
    .is("voided_at", null)
    .order("issued_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (
    data as {
      request_id: string | null;
      number: string;
      issued_at: string;
      snapshot: {
        total?: number;
        kodePermintaan?: string;
        items?: unknown[];
        pembeli?: { instansi?: string; pejabat?: string };
      };
    }[]
  )
    .filter((d) => d.request_id)
    .map((d) => ({
      id: d.request_id as string,
      requestId: d.request_id as string,
      code: d.snapshot?.kodePermintaan || d.number,
      status: "diproses",
      total: d.snapshot?.total ?? 0,
      createdAt: d.issued_at,
      buyerName: d.snapshot?.pembeli?.pejabat || "—",
      buyerInstitution: d.snapshot?.pembeli?.instansi ?? null,
      itemCount: d.snapshot?.items?.length ?? 0,
      jenis: "pengadaan" as const,
    }));
}

export async function listOrders(limit = 100): Promise<OrderSummary[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("orders")
    .select("id, code, status, total, created_at, address, order_items(count)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (
    data as {
      id: string;
      code: string;
      status: string;
      total: number;
      created_at: string;
      address: { name?: string; institution?: string } | null;
      order_items: { count: number }[] | null;
    }[]
  ).map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    total: o.total,
    createdAt: o.created_at,
    buyerName: o.address?.name ?? "—",
    buyerInstitution: o.address?.institution ?? null,
    itemCount: o.order_items?.[0]?.count ?? 0,
  }));
}
