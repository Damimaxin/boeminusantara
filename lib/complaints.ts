import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";
import { getMyQuote, type SessionUser } from "@/lib/portal";

/**
 * Komplain & rating. Ditulis lewat server (service role) dengan pengecekan
 * kepemilikan: pembeli hanya bisa mengomentari penawaran miliknya sendiri.
 */

/* ------------------------------- PORTAL ------------------------------- */

/** Simpan/perbarui rating pembeli untuk satu penawaran (1 penawaran 1 ulasan). */
export async function submitRating(
  user: SessionUser,
  requestId: string,
  stars: number,
  comment: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await getMyQuote(user, requestId)))
    return { ok: false, error: "Transaksi tidak dikenali." };
  const s = Math.round(stars);
  if (s < 1 || s > 5) return { ok: false, error: "Beri bintang 1–5." };

  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "Sistem tidak tersedia." };

  const { error } = await sb.from("ratings").upsert(
    {
      request_id: requestId,
      buyer_email: user.email,
      stars: s,
      comment: comment.trim() || null,
    },
    { onConflict: "request_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitComplaint(
  user: SessionUser,
  requestId: string,
  subject: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await getMyQuote(user, requestId)))
    return { ok: false, error: "Transaksi tidak dikenali." };
  if (!subject.trim() || !message.trim())
    return { ok: false, error: "Judul dan isi keluhan wajib diisi." };

  const sb = getAdminSupabase();
  if (!sb) return { ok: false, error: "Sistem tidak tersedia." };

  const { error } = await sb.from("complaints").insert({
    request_id: requestId,
    buyer_email: user.email,
    subject: subject.trim(),
    message: message.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type MyRating = { stars: number; comment: string | null };

export async function getMyRating(requestId: string): Promise<MyRating | null> {
  const sb = getAdminSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("ratings")
    .select("stars, comment")
    .eq("request_id", requestId)
    .maybeSingle();
  return data ? (data as MyRating) : null;
}

export type MyComplaint = {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export async function listMyComplaints(requestId: string): Promise<MyComplaint[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("complaints")
    .select("id, subject, message, status, admin_note, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });
  return (
    (data ?? []) as {
      id: string;
      subject: string;
      message: string;
      status: string;
      admin_note: string | null;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
  }));
}

/* -------------------------------- ADMIN -------------------------------- */

export type AdminComplaint = MyComplaint & {
  buyerEmail: string;
  requestId: string | null;
};

export async function listComplaints(status?: string): Promise<AdminComplaint[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  let q = sb
    .from("complaints")
    .select("id, request_id, buyer_email, subject, message, status, admin_note, created_at")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (
    (data ?? []) as {
      id: string;
      request_id: string | null;
      buyer_email: string;
      subject: string;
      message: string;
      status: string;
      admin_note: string | null;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    requestId: r.request_id,
    buyerEmail: r.buyer_email,
    subject: r.subject,
    message: r.message,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
  }));
}

export async function setComplaintStatus(
  id: string,
  status: "open" | "handling" | "resolved",
  adminNote?: string,
): Promise<void> {
  const sb = getAdminSupabase();
  if (!sb) return;
  await sb
    .from("complaints")
    .update({
      status,
      admin_note: adminNote ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/** Angka untuk dashboard: komplain terbuka + rata-rata rating. */
export async function complaintStats(): Promise<{
  open: number;
  handling: number;
  avgRating: number | null;
  ratingCount: number;
}> {
  const sb = getAdminSupabase();
  if (!sb) return { open: 0, handling: 0, avgRating: null, ratingCount: 0 };

  const [{ data: comp }, { data: rat }] = await Promise.all([
    sb.from("complaints").select("status"),
    sb.from("ratings").select("stars"),
  ]);

  const c = (comp ?? []) as { status: string }[];
  const r = (rat ?? []) as { stars: number }[];
  const avg = r.length ? r.reduce((s, x) => s + x.stars, 0) / r.length : null;

  return {
    open: c.filter((x) => x.status === "open").length,
    handling: c.filter((x) => x.status === "handling").length,
    avgRating: avg,
    ratingCount: r.length,
  };
}
