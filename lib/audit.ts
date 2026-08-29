import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { checkAdmin, isOwnerEmail } from "@/lib/admin/auth";

/**
 * Jejak audit: catat siapa melakukan apa di panel.
 *
 * Dipanggil dari server action SETELAH aksinya berhasil. Sengaja tidak pernah
 * melempar error — mencatat jejak tidak boleh menggagalkan aksi yang sudah
 * terlanjur terjadi. Kegagalan cukup masuk log server.
 */
export async function recordAudit(entry: {
  action: string;
  target?: string | null;
  detail?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const gate = await checkAdmin();
    const actor = gate.ok ? gate.email : "tidak-dikenal";

    const sb = getAdminSupabase();
    if (!sb) return;

    await sb.from("audit_log").insert({
      actor_email: actor,
      action: entry.action,
      target: entry.target ?? null,
      detail: (entry.detail ?? null) as never,
    });
  } catch (e) {
    console.error("[audit] gagal mencatat:", e instanceof Error ? e.message : e);
  }
}

export type AuditRow = {
  id: number;
  actorEmail: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

/**
 * Baca jejak audit — HANYA pemilik. Staf yang memaksa memanggil ini tetap dapat
 * daftar kosong; gerbang sebenarnya diperiksa lagi di halaman /admin/pemilik.
 */
export async function listAudit(opts: {
  actor?: string;
  action?: string;
  limit?: number;
} = {}): Promise<AuditRow[]> {
  const gate = await checkAdmin();
  if (!gate.ok || !isOwnerEmail(gate.email)) return [];

  const sb = getAdminSupabase();
  if (!sb) return [];

  let q = sb
    .from("audit_log")
    .select("id, actor_email, action, target, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.actor) q = q.eq("actor_email", opts.actor);
  if (opts.action) q = q.ilike("action", `${opts.action}%`);

  const { data, error } = await q;
  if (error || !data) return [];

  return (
    data as {
      id: number;
      actor_email: string;
      action: string;
      target: string | null;
      detail: Record<string, unknown> | null;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    actorEmail: r.actor_email,
    action: r.action,
    target: r.target,
    detail: r.detail,
    createdAt: r.created_at,
  }));
}

/** Daftar pelaku unik + jumlah tindakannya, untuk penyaring & ringkasan. */
export async function auditActors(): Promise<{ email: string; count: number }[]> {
  const gate = await checkAdmin();
  if (!gate.ok || !isOwnerEmail(gate.email)) return [];

  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data } = await sb.from("audit_log").select("actor_email").limit(5000);
  const hitung = new Map<string, number>();
  for (const r of (data ?? []) as { actor_email: string }[]) {
    hitung.set(r.actor_email, (hitung.get(r.actor_email) ?? 0) + 1);
  }
  return [...hitung.entries()]
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => b.count - a.count);
}
