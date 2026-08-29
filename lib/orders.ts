import "server-only";
import { randomBytes } from "node:crypto";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { ppnAmount } from "@/lib/format";
import { isInstantBuyable } from "@/lib/checkout";

/**
 * Pembuatan pesanan. SATU aturan yang tidak boleh dilanggar:
 * harga, nama, dan kelayakan beli SELALU diambil ulang dari database
 * berdasarkan slug. Angka apa pun yang dikirim browser diabaikan — kalau
 * tidak, pembeli tinggal ubah harga di keranjang lewat devtools.
 */

export type CartLine = { slug: string; qty: number };

export type Buyer = {
  name: string;
  email: string;
  phone: string;
  institution: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  note: string | null;
};

export type OrderItemSnapshot = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
};

export type CreatedOrder = {
  id: string;
  code: string;
  subtotal: number;
  ppn: number;
  total: number;
  items: OrderItemSnapshot[];
};

/**
 * Nomor pesanan: BOEMI-<tanggal>-<acak>.
 * Bagian acak bukan hiasan — halaman status pesanan dibuka tanpa login, jadi
 * nomornya harus tidak bisa ditebak (kalau berurutan, orang bisa mengintip
 * pesanan orang lain dengan menaikkan angka).
 */
function generateOrderCode(): string {
  const d = new Date();
  const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `BOEMI-${ymd}-${rand}`;
}

export class CheckoutError extends Error {}

/**
 * Validasi keranjang terhadap database, lalu simpan pesanan + itemnya.
 * Melempar CheckoutError dengan pesan yang bisa langsung dibaca pembeli.
 */
export async function createOrder(
  lines: CartLine[],
  buyer: Buyer,
  userId: string | null,
): Promise<CreatedOrder> {
  const sb = getAdminSupabase();
  if (!sb) throw new CheckoutError("Sistem pemesanan sedang tidak tersedia.");

  const wanted = lines
    .map((l) => ({ slug: String(l.slug), qty: Math.floor(Number(l.qty)) }))
    .filter((l) => l.slug && Number.isFinite(l.qty) && l.qty > 0 && l.qty <= 999);

  if (wanted.length === 0) throw new CheckoutError("Keranjang kosong.");

  const { data, error } = await sb
    .from("products")
    .select("id, slug, name, price, stock, active")
    .in(
      "slug",
      wanted.map((l) => l.slug),
    );
  if (error) throw new CheckoutError("Gagal membaca katalog. Coba lagi.");

  const rows = (data ?? []) as {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock: number;
    active: boolean;
  }[];

  const items: OrderItemSnapshot[] = [];
  for (const line of wanted) {
    const p = rows.find((r) => r.slug === line.slug);
    if (!p || !p.active)
      throw new CheckoutError(`Produk "${line.slug}" sudah tidak tersedia.`);
    if (!isInstantBuyable(p.price))
      throw new CheckoutError(
        `"${p.name}" hanya dilayani lewat penawaran resmi, tidak bisa dibeli online.`,
      );
    if (p.stock < line.qty)
      throw new CheckoutError(
        `Stok "${p.name}" tinggal ${p.stock}. Kurangi jumlahnya.`,
      );

    items.push({
      productId: p.id,
      name: p.name,
      price: p.price, // dari DB, bukan dari browser
      qty: line.qty,
      subtotal: p.price * line.qty,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const ppn = ppnAmount(subtotal);
  const total = subtotal + ppn;
  const code = generateOrderCode();

  const { data: orderRow, error: orderErr } = await sb
    .from("orders")
    .insert({
      code,
      user_id: userId,
      status: "pending",
      subtotal,
      ppn_enabled: true,
      ppn_amount: ppn,
      discount: 0,
      total,
      address: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        institution: buyer.institution,
        line: buyer.address,
        city: buyer.city,
        postal_code: buyer.postalCode,
      },
      note: buyer.note,
    })
    .select("id, code")
    .single();

  if (orderErr || !orderRow)
    throw new CheckoutError("Gagal menyimpan pesanan. Coba lagi.");

  const { error: itemErr } = await sb.from("order_items").insert(
    items.map((i) => ({
      order_id: orderRow.id,
      product_id: i.productId,
      name: i.name,
      price: i.price,
      qty: i.qty,
      subtotal: i.subtotal,
    })),
  );

  if (itemErr) {
    // Pesanan tanpa item = data sampah yang membingungkan admin. Bersihkan.
    await sb.from("orders").delete().eq("id", orderRow.id);
    throw new CheckoutError("Gagal menyimpan rincian pesanan. Coba lagi.");
  }

  return { id: orderRow.id, code: orderRow.code, subtotal, ppn, total, items };
}

/**
 * Catat hasil pembayaran dari webhook gateway.
 *
 * Dibuat IDEMPOTEN: gateway mengirim notifikasi yang sama berkali-kali
 * (retry, atau saat status berubah). Stok hanya dikurangi pada transisi
 * pertama pending → paid, supaya notifikasi ganda tidak menggerus stok dua kali.
 */
export async function applyPaymentResult(params: {
  orderCode: string;
  newStatus: "paid" | "pending" | "cancelled";
  gateway: string;
  reference: string | null;
  /** Nominal yang benar-benar dibayar, untuk status 'paid'. */
  paidAmount?: number | null;
  raw: unknown;
}): Promise<{ applied: boolean; reason?: string }> {
  const sb = getAdminSupabase();
  if (!sb) return { applied: false, reason: "no-db" };

  const { data: order } = await sb
    .from("orders")
    .select("id, status, total")
    .eq("code", params.orderCode)
    .maybeSingle();

  if (!order) return { applied: false, reason: "order-not-found" };

  const o = order as { id: string; status: string; total: number };
  const current = o.status;
  const orderId = o.id;

  // Status "lunas" dari gateway tidak otomatis dipercaya: nominalnya harus
  // menutup tagihan. Kurang bayar ditandai 'pending' supaya diperiksa manusia,
  // bukan langsung dianggap lunas dan barangnya dikirim.
  let newStatus = params.newStatus;
  let kurangBayar = false;
  if (
    newStatus === "paid" &&
    typeof params.paidAmount === "number" &&
    params.paidAmount < o.total
  ) {
    newStatus = "pending";
    kurangBayar = true;
    console.warn(
      `[bayar] ${params.orderCode}: dibayar ${params.paidAmount} dari tagihan ${o.total} — tidak dilunasi otomatis.`,
    );
  }

  // Jejak pembayaran selalu dicatat, bahkan kalau status tidak berubah —
  // berguna saat menelusuri sengketa pembayaran.
  await sb.from("payments").insert({
    order_id: orderId,
    gateway: params.gateway,
    status: kurangBayar ? "kurang-bayar" : newStatus,
    reference: params.reference,
    raw: params.raw as never,
  });

  // Pesanan yang sudah diproses/dikirim tidak boleh dimundurkan oleh webhook telat.
  const FINAL = ["processing", "shipped", "done", "cancelled"];
  if (FINAL.includes(current)) return { applied: false, reason: "already-final" };
  if (current === newStatus) return { applied: false, reason: "no-change" };

  await sb.from("orders").update({ status: newStatus }).eq("id", orderId);

  if (newStatus === "paid" && current === "pending") {
    await decrementStockForOrder(orderId);
  }

  return { applied: true };
}

/** Kurangi stok sesuai isi pesanan, dan catat mutasinya agar bisa diaudit. */
async function decrementStockForOrder(orderId: string): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) return;

  const { data: items } = await sb
    .from("order_items")
    .select("product_id, qty, name")
    .eq("order_id", orderId);

  for (const it of (items ?? []) as {
    product_id: string | null;
    qty: number;
    name: string;
  }[]) {
    if (!it.product_id) continue;

    const { data: p } = await sb
      .from("products")
      .select("stock")
      .eq("id", it.product_id)
      .maybeSingle();
    if (!p) continue;

    const before = (p as { stock: number }).stock;
    const after = Math.max(0, before - it.qty);

    await sb.from("products").update({ stock: after }).eq("id", it.product_id);
    await sb.from("stock_movements").insert({
      product_id: it.product_id,
      type: "out",
      qty: it.qty,
      ref: `ORDER:${orderId}`,
      note: `Penjualan online — ${it.name}`,
    });
  }
}

export type OrderDetail = {
  code: string;
  status: string;
  subtotal: number;
  ppn: number;
  total: number;
  createdAt: string;
  buyerName: string;
  items: { name: string; price: number; qty: number; subtotal: number }[];
};

/** Detail pesanan untuk halaman status. Dicari via `code` yang tak bisa ditebak. */
export async function getOrderByCode(code: string): Promise<OrderDetail | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("orders")
    .select("id, code, status, subtotal, ppn_amount, total, created_at, address")
    .eq("code", code)
    .maybeSingle();
  if (error || !data) return null;

  const o = data as {
    id: string;
    code: string;
    status: string;
    subtotal: number;
    ppn_amount: number;
    total: number;
    created_at: string;
    address: { name?: string } | null;
  };

  const { data: itemRows } = await sb
    .from("order_items")
    .select("name, price, qty, subtotal")
    .eq("order_id", o.id);

  return {
    code: o.code,
    status: o.status,
    subtotal: o.subtotal,
    ppn: o.ppn_amount,
    total: o.total,
    createdAt: o.created_at,
    buyerName: o.address?.name ?? "",
    items: (itemRows ?? []) as OrderDetail["items"],
  };
}
