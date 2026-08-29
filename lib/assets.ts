import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { listMyQuotes, type SessionUser } from "@/lib/portal";
import { listDocumentsForRequest } from "@/lib/admin/documents";

/**
 * Daftar aset instansi — DITURUNKAN dari dokumen BAST yang sudah terbit.
 * Tiap baris barang di sebuah BAST adalah satu aset yang kini dimiliki sekolah.
 * Sumber kebenaran tetap BAST; tabel asset_care hanya menambah garansi & servis.
 */

// Dipakai saat garansi/servis belum pernah diisi, supaya statusnya tetap
// bermakna. Ditandai "perkiraan" di UI — angka ini boleh diubah instansi.
const DEFAULT_WARRANTY_MONTHS = 12;
const DEFAULT_SERVICE_INTERVAL_MONTHS = 6;

export type CareStatus = "ok" | "segera" | "lewat" | "tidak-terjadwal";

export type Asset = {
  key: string; // <bast id>#<indeks>
  name: string;
  qty: number;
  unit: string;
  institution: string;
  acquiredAt: string; // ISO tanggal BAST
  sourceBastId: string;
  sourceBastNumber: string;

  warrantyMonths: number;
  warrantyDefault: boolean; // true = masih pakai perkiraan, belum dikonfirmasi
  warrantyUntil: string; // ISO
  warrantyActive: boolean;

  serviceIntervalMonths: number;
  serviceDefault: boolean;
  lastServicedAt: string | null;
  nextServiceAt: string; // ISO
  serviceStatus: CareStatus;
  daysToService: number;

  note: string | null;
};

function addMonths(iso: string, months: number): Date {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

type CareRow = {
  asset_key: string;
  warranty_months: number | null;
  service_interval_months: number | null;
  last_serviced_at: string | null;
  note: string | null;
};

/** Aset milik pemakai portal ini. */
export async function listMyAssets(user: SessionUser): Promise<Asset[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const quotes = await listMyQuotes(user);
  if (quotes.length === 0) return [];

  // Kumpulkan BAST dari seluruh permintaan milik pemakai.
  const bast: {
    id: string;
    number: string;
    tanggal: string;
    institution: string;
    items: { nama: string; qty: number; satuan: string }[];
  }[] = [];

  for (const q of quotes) {
    const docs = await listDocumentsForRequest(q.id);
    for (const d of docs) {
      if (d.docType !== "BAST" || d.voidedAt) continue;
      bast.push({
        id: d.id,
        number: d.number,
        tanggal: d.snapshot.tanggal,
        institution: d.snapshot.pembeli.instansi || q.institution || "",
        items: d.snapshot.items.map((it) => ({
          nama: it.nama,
          qty: it.qty,
          satuan: it.satuan,
        })),
      });
    }
  }

  if (bast.length === 0) return [];

  // Muat catatan perawatan yang sudah ada.
  const keys: string[] = [];
  for (const b of bast) b.items.forEach((_, i) => keys.push(`${b.id}#${i}`));

  const { data: careData } = await sb
    .from("asset_care")
    .select("asset_key, warranty_months, service_interval_months, last_serviced_at, note")
    .in("asset_key", keys);

  const care = new Map<string, CareRow>();
  for (const r of (careData ?? []) as CareRow[]) care.set(r.asset_key, r);

  const now = new Date();
  const assets: Asset[] = [];

  for (const b of bast) {
    b.items.forEach((it, i) => {
      const key = `${b.id}#${i}`;
      const c = care.get(key);

      const warrantyMonths = c?.warranty_months ?? DEFAULT_WARRANTY_MONTHS;
      const warrantyDefault = c?.warranty_months == null;
      const warrantyUntil = addMonths(b.tanggal, warrantyMonths);

      const intervalMonths =
        c?.service_interval_months ?? DEFAULT_SERVICE_INTERVAL_MONTHS;
      const serviceDefault = c?.service_interval_months == null;
      const basis = c?.last_serviced_at ?? b.tanggal;
      const nextService = addMonths(basis, intervalMonths);
      const daysToService = daysBetween(nextService, now);

      let serviceStatus: CareStatus;
      if (intervalMonths <= 0) serviceStatus = "tidak-terjadwal";
      else if (daysToService < 0) serviceStatus = "lewat";
      else if (daysToService <= 30) serviceStatus = "segera";
      else serviceStatus = "ok";

      assets.push({
        key,
        name: it.nama,
        qty: it.qty,
        unit: it.satuan || "unit",
        institution: b.institution,
        acquiredAt: b.tanggal,
        sourceBastId: b.id,
        sourceBastNumber: b.number,
        warrantyMonths,
        warrantyDefault,
        warrantyUntil: warrantyUntil.toISOString(),
        warrantyActive: warrantyUntil.getTime() >= now.getTime(),
        serviceIntervalMonths: intervalMonths,
        serviceDefault,
        lastServicedAt: c?.last_serviced_at ?? null,
        nextServiceAt: nextService.toISOString(),
        serviceStatus,
        daysToService,
        note: c?.note ?? null,
      });
    });
  }

  // Yang paling mendesak dirawat naik ke atas.
  const rank: Record<CareStatus, number> = {
    lewat: 0,
    segera: 1,
    ok: 2,
    "tidak-terjadwal": 3,
  };
  assets.sort(
    (a, b) =>
      rank[a.serviceStatus] - rank[b.serviceStatus] ||
      a.daysToService - b.daysToService,
  );

  return assets;
}

/** Ringkasan untuk lencana beranda. */
export async function assetCareSummary(
  user: SessionUser,
): Promise<{ total: number; lewat: number; segera: number; garansiHabisSegera: number }> {
  const assets = await listMyAssets(user);
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 86_400_000);

  return {
    total: assets.length,
    lewat: assets.filter((a) => a.serviceStatus === "lewat").length,
    segera: assets.filter((a) => a.serviceStatus === "segera").length,
    garansiHabisSegera: assets.filter(
      (a) =>
        a.warrantyActive &&
        new Date(a.warrantyUntil).getTime() <= in60.getTime(),
    ).length,
  };
}

/** Pastikan asset_key ini memang milik pemakai — pagar sebelum menulis care. */
export async function assetMilikSaya(
  user: SessionUser,
  assetKey: string,
): Promise<boolean> {
  const assets = await listMyAssets(user);
  return assets.some((a) => a.key === assetKey);
}
