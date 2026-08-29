import { NextResponse, type NextRequest } from "next/server";
import { verifyCallbackToken, mapInvoiceStatus } from "@/lib/xendit";
import { applyPaymentResult } from "@/lib/orders";

/**
 * Webhook pembayaran Xendit.
 *
 * Alamatnya /pembayaran/xendit, BUKAN /api/... — di server, /api/ sudah dipakai
 * nginx untuk mem-proxy ke boemi-api, jadi route Next di bawah /api tidak akan
 * pernah kena dari luar.
 *
 * Endpoint ini publik (Xendit tidak bisa login), maka header token yang jadi
 * gerbangnya. Tanpa token yang cocok = ditolak, titik.
 */
export async function POST(request: NextRequest) {
  if (!verifyCallbackToken(request.headers.get("x-callback-token"))) {
    // Jangan bocorkan alasan penolakan — cukup 403.
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const p = payload as {
    id?: string;
    external_id?: string;
    status?: string;
    paid_amount?: number;
    amount?: number;
  };

  if (!p.external_id) return NextResponse.json({ ok: false }, { status: 400 });

  const status = mapInvoiceStatus(p.status ?? "");
  if (!status) return NextResponse.json({ ok: true, ignored: true });

  await applyPaymentResult({
    orderCode: p.external_id,
    newStatus: status,
    gateway: "xendit",
    reference: p.id ?? null,
    // Jumlah yang benar-benar dibayar ikut dikirim: pesanan hanya dilunasi
    // kalau nominalnya memang cukup, bukan sekadar karena statusnya "PAID".
    paidAmount: status === "paid" ? (p.paid_amount ?? p.amount ?? null) : null,
    raw: payload,
  });

  // Selalu 200 setelah diproses, supaya Xendit berhenti mengulang kirim.
  return NextResponse.json({ ok: true });
}
