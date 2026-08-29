"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkAdmin } from "@/lib/admin/auth";
import { setComplaintStatus } from "@/lib/complaints";
import { recordAudit } from "@/lib/audit";

export async function tanganiKomplainAction(formData: FormData): Promise<void> {
  const gate = await checkAdmin();
  if (!gate.ok) redirect("/masuk?next=/admin/komplain");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "open"
    | "handling"
    | "resolved";
  const note = String(formData.get("adminNote") ?? "").trim();
  if (!id || !["open", "handling", "resolved"].includes(status)) return;

  await setComplaintStatus(id, status, note || undefined);
  await recordAudit({ action: "komplain.status", target: id, detail: { status } });
  revalidatePath("/admin/komplain");
  revalidatePath("/admin");
}
