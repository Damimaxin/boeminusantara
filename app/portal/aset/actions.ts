"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/portal";
import { assetMilikSaya } from "@/lib/assets";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

export type CareState = { ok: boolean; error?: string; success?: string };

async function requireMine(assetKey: string) {
  const user = await getPortalUser();
  if (!user) redirect("/masuk?next=/portal/aset");
  // Pagar kepemilikan: asset_key harus benar-benar turunan BAST milik pemakai.
  if (!(await assetMilikSaya(user, assetKey))) {
    return { user: null as never, blocked: true };
  }
  return { user, blocked: false };
}

/** Simpan garansi & jadwal servis satu aset. */
export async function saveCareAction(
  _prev: CareState,
  formData: FormData,
): Promise<CareState> {
  const assetKey = String(formData.get("assetKey") ?? "");
  const { user, blocked } = await requireMine(assetKey);
  if (blocked) return { ok: false, error: "Aset tidak dikenali." };

  const warranty = Number(formData.get("warrantyMonths"));
  const interval = Number(formData.get("serviceIntervalMonths"));
  const note = String(formData.get("note") ?? "").trim();

  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "Database tidak tersedia." };

  const { error } = await sb.from("asset_care").upsert(
    {
      asset_key: assetKey,
      buyer_email: user.email,
      warranty_months: Number.isFinite(warranty) && warranty > 0 ? warranty : null,
      service_interval_months:
        Number.isFinite(interval) && interval >= 0 ? interval : null,
      note: note || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "asset_key" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/aset");
  revalidatePath("/portal");
  return { ok: true, success: "Tersimpan." };
}

/** Tandai aset baru saja dirawat hari ini — jadwal berikutnya bergeser sendiri. */
export async function markServicedAction(formData: FormData): Promise<void> {
  const assetKey = String(formData.get("assetKey") ?? "");
  const { user, blocked } = await requireMine(assetKey);
  if (blocked) return;

  const sb = getAdminSupabase();
  if (!sb) return;

  const today = new Date().toISOString().slice(0, 10);
  await sb.from("asset_care").upsert(
    {
      asset_key: assetKey,
      buyer_email: user.email,
      last_serviced_at: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "asset_key" },
  );

  revalidatePath("/portal/aset");
  revalidatePath("/portal");
}
