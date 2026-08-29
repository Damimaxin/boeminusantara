import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Xendit Invoice API — dipanggil dengan fetch biasa, tanpa SDK.
 * Satu dependency pembayaran = satu pintu supply-chain baru, sementara yang
 * dibutuhkan cuma satu HTTP call dan satu pemeriksaan header.
 *
 * Tanpa XENDIT_SECRET_KEY seluruh modul "mati" dengan sopan (return null) dan
 * pesanan tetap tercatat untuk dikonfirmasi manual.
 */

const API = "https://api.xendit.co";

export const isXenditConfigured = () => Boolean(process.env.XENDIT_SECRET_KEY);

function authHeader(): string {
  const key = process.env.XENDIT_SECRET_KEY ?? "";
  // Basic auth: secret key sebagai username, password kosong.
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export type InvoiceItem = {
  name: string;
  price: number;
  quantity: number;
};

/**
 * Terbitkan invoice Xendit. Mengembalikan URL pembayaran, atau null bila
 * gateway belum dikonfigurasi. Melempar Error kalau gateway ada tapi menolak.
 */
export async function createInvoice(params: {
  orderCode: string;
  amount: number;
  payerEmail: string;
  description: string;
  items: InvoiceItem[];
  successUrl: string;
  failureUrl: string;
}): Promise<{ id: string; invoiceUrl: string } | null> {
  if (!isXenditConfigured()) return null;

  const res = await fetch(`${API}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // external_id = nomor pesanan kita; dipakai lagi saat webhook masuk.
      external_id: params.orderCode,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      currency: "IDR",
      success_redirect_url: params.successUrl,
      failure_redirect_url: params.failureUrl,
      items: params.items.map((i) => ({
        name: i.name.slice(0, 256),
        price: i.price,
        quantity: i.quantity,
      })),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    invoice_url?: string;
    message?: string;
    error_code?: string;
  };

  if (!res.ok || !json.id || !json.invoice_url) {
    throw new Error(
      json.message || json.error_code || `Xendit menolak invoice (${res.status}).`,
    );
  }

  return { id: json.id, invoiceUrl: json.invoice_url };
}

/**
 * Verifikasi keaslian webhook Xendit.
 *
 * INI GERBANGNYA: tanpa cek ini siapa pun bisa mengirim POST "sudah lunas" ke
 * alamat webhook kita dan barang dikirim tanpa pernah dibayar.
 *
 * Xendit mengirim token statis di header `x-callback-token`. Dibandingkan
 * dengan timingSafeEqual supaya waktu proses tidak membocorkan isi token
 * karakter demi karakter.
 */
export function verifyCallbackToken(received: string | null): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected || !received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/** Terjemahkan status invoice Xendit ke status pesanan kita. */
export function mapInvoiceStatus(status: string): "paid" | "pending" | "cancelled" | null {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "SETTLED":
      return "paid";
    case "PENDING":
      return "pending";
    case "EXPIRED":
      return "cancelled";
    default:
      return null;
  }
}
