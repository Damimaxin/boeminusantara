import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * Data-access PORTAL KLIEN (sekolah & instansi).
 *
 * ATURAN TUNGGAL YANG TIDAK BOLEH DILANGGAR:
 * setiap fungsi di sini menerima identitas pemakai dari SESSION SERVER, lalu
 * menyaring datanya sendiri. Tidak ada fungsi yang menerima "id pemilik" dari
 * halaman atau dari URL — kalau ada, satu sekolah bisa membaca dokumen sekolah
 * lain hanya dengan mengganti angka di alamat.
 *
 * Pencocokan kepemilikan: user_id bila permintaan dibuat sambil login, atau
 * email bila dibuat sebelum punya akun. Email dipakai karena sudah diverifikasi
 * saat pendaftaran.
 */

export type SessionUser = { id: string; email: string };

/** Identitas pemakai portal dari cookie session. Null = belum login. */
export async function getPortalUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  return { id: user.id, email: user.email.toLowerCase() };
}

export type PortalQuote = {
  id: string;
  code: string;
  status: string;
  institution: string | null;
  createdAt: string;
  itemCount: number;
  subtotal: number;
};

/** Permintaan penawaran milik pemakai ini saja. */
export async function listMyQuotes(user: SessionUser): Promise<PortalQuote[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("quote_requests")
    .select("id, code, status, institution, created_at, quote_request_items(subtotal)")
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (
    data as {
      id: string;
      code: string;
      status: string;
      institution: string | null;
      created_at: string;
      quote_request_items: { subtotal: number }[] | null;
    }[]
  ).map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    institution: r.institution,
    createdAt: r.created_at,
    itemCount: r.quote_request_items?.length ?? 0,
    subtotal: (r.quote_request_items ?? []).reduce(
      (s, i) => s + Number(i.subtotal || 0),
      0,
    ),
  }));
}

export type PortalOrder = {
  code: string;
  status: string;
  total: number;
  createdAt: string;
};

/** Pesanan (beli langsung) milik pemakai ini saja. */
export async function listMyOrders(user: SessionUser): Promise<PortalOrder[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("orders")
    .select("code, status, total, created_at, address")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // Pesanan tamu tidak punya user_id, jadi dicocokkan lewat email di alamat.
  return (
    data as {
      code: string;
      status: string;
      total: number;
      created_at: string;
      address: { email?: string } | null;
      user_id?: string | null;
    }[]
  )
    .filter(
      (o) =>
        o.user_id === user.id ||
        (o.address?.email ?? "").toLowerCase() === user.email,
    )
    .map((o) => ({
      code: o.code,
      status: o.status,
      total: o.total,
      createdAt: o.created_at,
    }));
}

export type PortalQuoteDetail = {
  id: string;
  code: string;
  status: string;
  institution: string | null;
  note: string | null;
  createdAt: string;
  items: {
    id: string;
    name: string;
    qty: number;
    price: number;
    buyerPrice: number | null;
  }[];
};

/**
 * Detail satu permintaan — HANYA bila memang milik pemakai ini.
 * Mengembalikan null bila bukan miliknya, sehingga halaman menampilkan
 * "tidak ditemukan" dan tidak membocorkan bahwa datanya ada.
 */
export async function getMyQuote(
  user: SessionUser,
  quoteId: string,
): Promise<PortalQuoteDetail | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("quote_requests")
    .select("id, code, status, institution, note, created_at, user_id, customer_email")
    .eq("id", quoteId)
    .maybeSingle();

  if (error || !data) return null;

  const r = data as {
    id: string;
    code: string;
    status: string;
    institution: string | null;
    note: string | null;
    created_at: string;
    user_id: string | null;
    customer_email: string;
  };

  const milikSaya =
    r.user_id === user.id || r.customer_email.toLowerCase() === user.email;
  if (!milikSaya) return null;

  const { data: itemRows } = await sb
    .from("quote_request_items")
    .select("id, name, qty, price, buyer_price")
    .eq("request_id", r.id);

  return {
    id: r.id,
    code: r.code,
    status: r.status,
    institution: r.institution,
    note: r.note,
    createdAt: r.created_at,
    items: (
      (itemRows ?? []) as {
        id: string;
        name: string;
        qty: number;
        price: number;
        buyer_price: number | null;
      }[]
    ).map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
      buyerPrice: i.buyer_price,
    })),
  };
}

/** Cek kepemilikan saja — dipakai Server Action sebelum menulis apa pun. */
export async function pastikanMilikSaya(
  user: SessionUser,
  quoteId: string,
): Promise<boolean> {
  return (await getMyQuote(user, quoteId)) !== null;
}

/* ============ PROFIL INSTANSI ============ */

export type BuyerProfile = {
  institution: string;
  npwp: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  officerName: string;
  officerNip: string;
  officerRole: string;
  budgetYear: number | null;
  budgetSource: string;
};

export const PROFIL_KOSONG: BuyerProfile = {
  institution: "",
  npwp: "",
  address: "",
  city: "",
  postalCode: "",
  phone: "",
  officerName: "",
  officerNip: "",
  officerRole: "",
  budgetYear: null,
  budgetSource: "",
};

export async function getMyProfile(user: SessionUser): Promise<BuyerProfile> {
  const sb = getAdminSupabase();
  if (!sb) return PROFIL_KOSONG;

  const { data, error } = await sb
    .from("buyer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return PROFIL_KOSONG;

  const r = data as Record<string, string | number | null>;
  return {
    institution: String(r.institution ?? ""),
    npwp: String(r.npwp ?? ""),
    address: String(r.address ?? ""),
    city: String(r.city ?? ""),
    postalCode: String(r.postal_code ?? ""),
    phone: String(r.phone ?? ""),
    officerName: String(r.officer_name ?? ""),
    officerNip: String(r.officer_nip ?? ""),
    officerRole: String(r.officer_role ?? ""),
    budgetYear: r.budget_year ? Number(r.budget_year) : null,
    budgetSource: String(r.budget_source ?? ""),
  };
}

export async function saveMyProfile(
  user: SessionUser,
  p: BuyerProfile,
): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("Database belum terhubung.");

  // user_id SELALU dari session — tidak pernah dari kiriman formulir.
  const { error } = await sb.from("buyer_profiles").upsert({
    user_id: user.id,
    institution: p.institution,
    npwp: p.npwp,
    address: p.address,
    city: p.city,
    postal_code: p.postalCode,
    phone: p.phone,
    officer_name: p.officerName,
    officer_nip: p.officerNip,
    officer_role: p.officerRole,
    budget_year: p.budgetYear,
    budget_source: p.budgetSource,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** Berapa persen profil terisi — dipakai pengingat di beranda portal. */
export function kelengkapanProfil(p: BuyerProfile): number {
  const wajib = [
    p.institution,
    p.npwp,
    p.address,
    p.city,
    p.phone,
    p.officerName,
    p.officerNip,
  ];
  const terisi = wajib.filter((v) => v.trim().length > 0).length;
  return Math.round((terisi / wajib.length) * 100);
}
