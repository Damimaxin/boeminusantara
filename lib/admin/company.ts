import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Identitas perusahaan yang tercetak di dokumen resmi + penomoran surat.
 *
 * Sengaja jadi setelan, bukan konstanta di kode: NPWP dan nama penanda tangan
 * muncul di surat yang dipakai sekolah untuk pertanggungjawaban. Kalau salah,
 * yang repot pembelinya. Harus bisa dibetulkan sendiri tanpa menunggu developer,
 * dan siap berubah saat Sinar Purnama Teknik dilebur ke Boemi.
 */

export type CompanyProfile = {
  nama: string;
  npwp: string;
  alamat: string;
  kota: string;
  telepon: string;
  email: string;
  penandatangan: string;
  jabatan: string;
  kodeSurat: string;
  /* Rekening penerima pembayaran — tercetak di invoice & kwitansi. */
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  /* Redaksi Surat Pernyataan PDN / Non-TKDN. Disediakan Boemi, bukan sistem. */
  pdnStatement: string;
  /* Tempo pembayaran invoice, dalam hari. */
  termDays: number;
};

const KOSONG: CompanyProfile = {
  nama: "",
  npwp: "",
  alamat: "",
  kota: "",
  telepon: "",
  email: "",
  penandatangan: "",
  jabatan: "",
  kodeSurat: "BNKB",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  pdnStatement: "",
  termDays: 14,
};

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const sb = getAdminSupabase();
  if (!sb) return KOSONG;

  const { data, error } = await sb
    .from("company_profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return KOSONG;

  const r = data as Record<string, string> & { term_days?: number };
  return {
    nama: r.nama ?? "",
    npwp: r.npwp ?? "",
    alamat: r.alamat ?? "",
    kota: r.kota ?? "",
    telepon: r.telepon ?? "",
    email: r.email ?? "",
    penandatangan: r.penandatangan ?? "",
    jabatan: r.jabatan ?? "",
    kodeSurat: r.kode_surat || "BNKB",
    bankName: r.bank_name ?? "",
    bankAccount: r.bank_account ?? "",
    bankHolder: r.bank_holder ?? "",
    pdnStatement: r.pdn_statement ?? "",
    termDays: Number(r.term_days ?? 14) || 14,
  };
}

export async function saveCompanyProfile(p: CompanyProfile): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("Database belum terhubung.");

  const { error } = await sb.from("company_profile").upsert({
    id: 1,
    nama: p.nama,
    npwp: p.npwp,
    alamat: p.alamat,
    kota: p.kota,
    telepon: p.telepon,
    email: p.email,
    penandatangan: p.penandatangan,
    jabatan: p.jabatan,
    kode_surat: p.kodeSurat,
    bank_name: p.bankName,
    bank_account: p.bankAccount,
    bank_holder: p.bankHolder,
    pdn_statement: p.pdnStatement,
    term_days: p.termDays,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** Kelengkapan identitas — dokumen resmi tidak boleh terbit dengan data kosong. */
export function profileSiap(p: CompanyProfile): boolean {
  return Boolean(p.nama && p.npwp && p.alamat && p.penandatangan);
}

export type DocType = "SP" | "INV" | "SJ" | "BAST" | "KW" | "NEG" | "PDN";

export const DOC_LABEL: Record<DocType, string> = {
  SP: "Surat Pesanan",
  INV: "Invoice",
  SJ: "Surat Jalan",
  BAST: "Berita Acara Serah Terima",
  KW: "Kwitansi",
  NEG: "Riwayat Negosiasi",
  PDN: "Surat Pernyataan PDN",
};

/**
 * Terbitkan nomor surat berikutnya. Format SEMENTARA sampai Boemi menetapkan
 * format resminya:  SP/BNKB/2607/0001
 *                   ^  ^    ^    ^ urut per jenis surat per tahun
 *                   |  |    tahun+bulan terbit
 *                   |  kode perusahaan (bisa diubah di setelan)
 *                   jenis surat
 *
 * Nomor urut diambil dari fungsi database ber-lock, sehingga dua admin yang
 * menekan tombol bersamaan tidak pernah mendapat nomor yang sama.
 */
export async function nextDocNumber(type: DocType): Promise<string> {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("Database belum terhubung.");

  const now = new Date();
  const year = now.getFullYear();

  const { data, error } = await sb.rpc("next_doc_number", {
    p_doc_type: type,
    p_year: year,
  });
  if (error) throw new Error("Gagal mengambil nomor surat: " + error.message);

  const profile = await getCompanyProfile();
  const yy = String(year).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const urut = String(Number(data)).padStart(4, "0");

  return `${type}/${profile.kodeSurat}/${yy}${mm}/${urut}`;
}
