"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  recordStockMovement,
  type MovementType,
} from "@/lib/admin/stock";
import { checkAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/audit";

/**
 * Server Action bisa dipanggil langsung lewat HTTP — jadi tiap action
 * memeriksa admin sendiri, tidak menumpang pagar layout.
 */
async function requireAdmin() {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/stok");
}

export type StockFormState = {
  ok: boolean;
  error?: string;
  preview?: boolean;
  success?: string;
  fieldErrors?: Record<string, string>;
};

const TYPES: MovementType[] = ["in", "out", "adjust"];

export async function recordStockMovementAction(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "").trim();
  const qtyRaw = String(formData.get("qty") ?? "").trim();
  const ref = String(formData.get("ref") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!productId) fieldErrors.productId = "Pilih produk.";
  if (!TYPES.includes(typeRaw as MovementType))
    fieldErrors.type = "Jenis mutasi tidak valid.";

  const qty = Number(qtyRaw);
  if (qtyRaw === "" || Number.isNaN(qty) || !Number.isInteger(qty))
    fieldErrors.qty = "Qty harus bilangan bulat.";
  else if (typeRaw !== "adjust" && qty <= 0)
    fieldErrors.qty = "Qty untuk Masuk/Keluar harus lebih dari 0.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const res = await recordStockMovement({
    productId,
    type: typeRaw as MovementType,
    qty,
    ref: ref || null,
    note: note || null,
  });

  if (!res.ok) {
    if (res.error === "preview") {
      return {
        ok: false,
        preview: true,
        error:
          "Mode preview — belum terhubung database. Mutasi tidak tersimpan.",
      };
    }
    return { ok: false, error: res.error };
  }

  await recordAudit({
    action: "stok." + typeRaw,
    target: productId,
    detail: { qty, ref: ref || null },
  });
  revalidatePath("/admin/stok");
  revalidatePath("/admin/produk");
  revalidatePath("/admin");
  return { ok: true, success: "Mutasi stok tercatat." };
}
