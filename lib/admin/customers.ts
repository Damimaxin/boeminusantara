import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Daftar pelanggan — DITURUNKAN dari jejak transaksi, bukan tabel terpisah.
 * Satu pelanggan = satu email, digabung dari permintaan penawaran, pesanan
 * online, dan profil instansi yang diisi di portal.
 */

export type Customer = {
  email: string;
  name: string;
  institution: string | null;
  phone: string | null;
  npwp: string | null;
  city: string | null;
  penawaranCount: number;
  pesananCount: number;
  totalNilai: number;
  lastActivity: string | null;
};

export async function listCustomers(): Promise<Customer[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const [{ data: quotes }, { data: orders }, { data: profiles }] = await Promise.all([
    sb
      .from("quote_requests")
      .select(
        "customer_email, customer_name, customer_phone, institution, user_id, created_at, quote_request_items(subtotal)",
      ),
    sb.from("orders").select("address, total, created_at"),
    sb.from("buyer_profiles").select("*"),
  ]);

  const map = new Map<string, Customer>();
  const emailByUser = new Map<string, string>();

  const ambil = (email: string): Customer => {
    const key = email.toLowerCase();
    let c = map.get(key);
    if (!c) {
      c = {
        email,
        name: "",
        institution: null,
        phone: null,
        npwp: null,
        city: null,
        penawaranCount: 0,
        pesananCount: 0,
        totalNilai: 0,
        lastActivity: null,
      };
      map.set(key, c);
    }
    return c;
  };
  const majukanWaktu = (c: Customer, iso: string | null) => {
    if (iso && (!c.lastActivity || iso > c.lastActivity)) c.lastActivity = iso;
  };

  // 1) Permintaan penawaran
  for (const q of (quotes ?? []) as {
    customer_email: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    institution: string | null;
    user_id: string | null;
    created_at: string;
    quote_request_items: { subtotal: number }[] | null;
  }[]) {
    if (!q.customer_email) continue;
    const c = ambil(q.customer_email);
    if (q.user_id) emailByUser.set(q.user_id, q.customer_email);
    if (!c.name && q.customer_name) c.name = q.customer_name;
    if (!c.institution && q.institution) c.institution = q.institution;
    if (!c.phone && q.customer_phone) c.phone = q.customer_phone;
    c.penawaranCount += 1;
    c.totalNilai += (q.quote_request_items ?? []).reduce(
      (s, i) => s + Number(i.subtotal || 0),
      0,
    );
    majukanWaktu(c, q.created_at);
  }

  // 2) Pesanan online (data pembeli ada di snapshot alamat)
  for (const o of (orders ?? []) as {
    address: {
      email?: string;
      name?: string;
      institution?: string;
      phone?: string;
    } | null;
    total: number;
    created_at: string;
  }[]) {
    const email = o.address?.email;
    if (!email) continue;
    const c = ambil(email);
    if (!c.name && o.address?.name) c.name = o.address.name;
    if (!c.institution && o.address?.institution) c.institution = o.address.institution;
    if (!c.phone && o.address?.phone) c.phone = o.address.phone;
    c.pesananCount += 1;
    c.totalNilai += Number(o.total || 0);
    majukanWaktu(c, o.created_at);
  }

  // 3) Profil instansi (lebih lengkap) — dikaitkan ke email lewat user_id
  for (const p of (profiles ?? []) as {
    user_id: string;
    institution: string | null;
    phone: string | null;
    npwp: string | null;
    city: string | null;
    officer_name: string | null;
    updated_at: string | null;
  }[]) {
    const email = emailByUser.get(p.user_id);
    if (!email) continue;
    const c = ambil(email);
    if (p.institution) c.institution = p.institution;
    if (p.phone) c.phone = p.phone;
    if (p.npwp) c.npwp = p.npwp;
    if (p.city) c.city = p.city;
    if (p.officer_name && (!c.name || c.name === email)) c.name = p.officer_name;
  }

  return [...map.values()]
    .map((c) => ({ ...c, name: c.name || c.email }))
    .sort((a, b) => (a.lastActivity ?? "") < (b.lastActivity ?? "") ? 1 : -1);
}
