"use server";

import { headers } from "next/headers";
import { createOrder, CheckoutError, type CartLine } from "@/lib/orders";
import { createInvoice, isXenditConfigured } from "@/lib/xendit";
import { createServerSupabase } from "@/lib/supabase-server";
import { notifyNewOrder, notifyBuyerOrderPlaced } from "@/lib/notify";

export type CheckoutState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Diisi kalau pembayaran online aktif — browser diarahkan ke sini. */
  payUrl?: string;
  /** Diisi kalau gateway belum aktif — pesanan tetap tercatat, bayar transfer. */
  orderCode?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{8,20}$/;

function parseLines(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Hanya slug + qty yang diambil. Harga dari browser sengaja dibuang.
    return parsed
      .map((x) => ({ slug: String(x?.slug ?? ""), qty: Number(x?.qty ?? 0) }))
      .filter((x) => x.slug);
  } catch {
    return [];
  }
}

export async function submitCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const lines = parseLines(String(formData.get("items") ?? "[]"));

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Nama penerima wajib diisi.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Email tidak valid.";
  if (!PHONE_RE.test(phone)) fieldErrors.phone = "Nomor telepon tidak valid.";
  if (!address) fieldErrors.address = "Alamat pengiriman wajib diisi.";
  if (!city) fieldErrors.city = "Kota/kabupaten wajib diisi.";
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  if (lines.length === 0)
    return { ok: false, error: "Keranjang kosong. Tambahkan produk dulu." };

  // Pesanan boleh tanpa login (pembeli ritel), tapi kalau login kita catat pemiliknya.
  let userId: string | null = null;
  const supabase = await createServerSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  let order;
  try {
    order = await createOrder(
      lines,
      {
        name,
        email,
        phone,
        institution: institution || null,
        address,
        city,
        postalCode: postalCode || null,
        note: note || null,
      },
      userId,
    );
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    return { ok: false, error: "Gagal membuat pesanan. Coba lagi." };
  }

  // Kabari tim + pembeli. Kegagalan email tidak boleh membatalkan pesanan,
  // jadi hasilnya cukup dicatat di log server.
  await Promise.allSettled([
    notifyNewOrder({
      code: order.code,
      total: order.total,
      buyerName: name,
      buyerPhone: phone,
      buyerEmail: email,
      institution: institution || null,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty })),
    }),
    notifyBuyerOrderPlaced({
      code: order.code,
      total: order.total,
      buyerEmail: email,
    }),
  ]);

  // Gateway belum dikonfigurasi → pesanan tetap sah, pembayaran dikonfirmasi manual.
  if (!isXenditConfigured()) return { ok: true, orderCode: order.code };

  const h = await headers();
  const origin =
    h.get("origin") ?? `https://${h.get("host") ?? "www.boeminusantara.com"}`;
  const statusUrl = `${origin}/pesanan/${order.code}`;

  try {
    const invoice = await createInvoice({
      orderCode: order.code,
      amount: order.total,
      payerEmail: email,
      description: `Pesanan ${order.code} — Boemi Nusantara`,
      items: [
        ...order.items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.qty,
        })),
        // PPN sebagai baris sendiri supaya jumlah item = nilai tagihan.
        { name: "PPN", price: order.ppn, quantity: 1 },
      ],
      successUrl: statusUrl,
      failureUrl: statusUrl,
    });

    if (!invoice) return { ok: true, orderCode: order.code };
    return { ok: true, payUrl: invoice.invoiceUrl, orderCode: order.code };
  } catch (e) {
    // Pesanan sudah tersimpan — jangan buang. Arahkan ke konfirmasi manual.
    console.error(
      "[checkout] gagal menerbitkan invoice:",
      e instanceof Error ? e.message : e,
    );
    return { ok: true, orderCode: order.code };
  }
}
