import "server-only";
import { getAdminSupabase, isAdminDbConnected } from "@/lib/admin/supabase-admin";
import { listAllProducts } from "@/lib/admin/products";

/**
 * Data-access ADMIN untuk mutasi stok (`stock_movements`).
 * Adaptasi logika inventory Warebox: in / out / adjust.
 * - in     : stok masuk (pembelian, retur pemasok) → stok bertambah.
 * - out    : stok keluar (penjualan, rusak) → stok berkurang.
 * - adjust : koreksi opname → set/geser sesuai qty (qty bisa +/-).
 *
 * Fallback: bila DB belum di-wire, list mengembalikan array kosong dan
 * pencatatan mengembalikan mode "preview".
 */

export type MovementType = "in" | "out" | "adjust";

export type StockMovement = {
  id: string;
  productId: string;
  productName: string; // hasil join / lookup untuk tampilan
  type: MovementType;
  qty: number;
  ref: string | null;
  note: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  product_id: string;
  type: MovementType;
  qty: number;
  ref: string | null;
  note: string | null;
  created_at: string;
  products?: { name: string } | null;
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: "Masuk",
  out: "Keluar",
  adjust: "Penyesuaian",
};

/** Daftar mutasi stok terbaru (default 100). */
export async function listStockMovements(
  limit = 100,
): Promise<StockMovement[]> {
  const sb = getAdminSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("stock_movements")
        .select("*, products(name)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as Row[]).map((r) => ({
        id: r.id,
        productId: r.product_id,
        productName: r.products?.name ?? r.product_id,
        type: r.type,
        qty: r.qty,
        ref: r.ref,
        note: r.note,
        createdAt: r.created_at,
      }));
    } catch {
      // fall through
    }
  }
  return [];
}

export type StockMovementInput = {
  productId: string;
  type: MovementType;
  qty: number;
  ref?: string | null;
  note?: string | null;
};

/**
 * Catat mutasi stok + sesuaikan kolom `products.stock`.
 * Delta stok: in => +qty, out => -qty, adjust => +qty (qty bisa negatif).
 *
 * Catatan: ini belum transaksional (butuh RPC/trigger di DB untuk atomic).
 * TODO(admin): pindahkan ke Postgres function agar movement + update stok atomik.
 */
export async function recordStockMovement(
  input: StockMovementInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isAdminDbConnected()) return { ok: false, error: "preview" };
  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "preview" };

  const delta =
    input.type === "in"
      ? Math.abs(input.qty)
      : input.type === "out"
        ? -Math.abs(input.qty)
        : input.qty; // adjust: apa adanya

  try {
    // 1) catat mutasi
    const { error: insErr } = await sb.from("stock_movements").insert({
      product_id: input.productId,
      type: input.type,
      qty: input.type === "out" ? Math.abs(input.qty) : input.qty,
      ref: input.ref ?? null,
      note: input.note ?? null,
    });
    if (insErr) throw insErr;

    // 2) baca stok sekarang lalu update (read-modify-write; lihat TODO atomic)
    const { data: prod, error: readErr } = await sb
      .from("products")
      .select("stock")
      .eq("id", input.productId)
      .single();
    if (readErr) throw readErr;

    const current = (prod as { stock: number }).stock ?? 0;
    const next = Math.max(0, current + delta);
    const { error: updErr } = await sb
      .from("products")
      .update({ stock: next, updated_at: new Date().toISOString() })
      .eq("id", input.productId);
    if (updErr) throw updErr;

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Opsi produk (id + nama) untuk dropdown form mutasi. */
export async function productOptions(): Promise<
  { id: string; name: string }[]
> {
  const products = await listAllProducts();
  return products.map((p) => ({ id: p.id, name: p.name }));
}
