import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { ownerAllowlist, listStaffEmails } from "@/lib/admin/auth";

/**
 * Notifikasi email lewat kotak surat Boemi sendiri di Hostinger
 * (info@boeminusantara.com), bukan layanan pihak ketiga.
 *
 * Alasannya bukan sekadar rapi: kotak surat itu MILIK client, jadi saat web
 * diserahkan nanti tidak ada akun perantara yang perlu ikut dipindah.
 *
 * Kenapa penting: tanpa ini pesanan masuk diam-diam dan baru ketahuan kalau ada
 * yang iseng membuka panel admin. Untuk web yang dijalankan tim client, itu
 * resep pesanan terlantar.
 *
 * Belum dikonfigurasi → fungsi diam saja dan mengembalikan alasannya.
 * Pesanan TIDAK PERNAH gagal gara-gara email.
 */

export const isNotifyConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.NOTIFY_FROM,
  );

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!isNotifyConfigured()) {
    transporter = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 465;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 = TLS langsung. Port lain (587) mulai polos lalu naik ke STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Alamat tujuan BALASAN. Penting kalau pengirimnya kotak surat "noreply":
 * pembeli yang menekan Balas harus tetap sampai ke kotak yang dibaca manusia,
 * bukan ke kotak mesin yang tidak pernah dibuka.
 */
const replyToHuman = () =>
  process.env.NOTIFY_REPLY_TO || "info@boeminusantara.com";

export type SendResult = { sent: boolean; reason?: string };

/** Uji sambungan + login ke server email TANPA mengirim apa pun. */
export async function verifyMailConnection(): Promise<SendResult> {
  const tx = getTransporter();
  if (!tx) return { sent: false, reason: "not-configured" };
  try {
    await tx.verify();
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}

async function sendEmail(params: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const tx = getTransporter();
  if (!tx) return { sent: false, reason: "not-configured" };
  if (params.to.length === 0) return { sent: false, reason: "no-recipient" };

  try {
    await tx.sendMail({
      from: process.env.NOTIFY_FROM,
      to: params.to,
      subject: params.subject,
      text: params.text,
      replyTo: params.replyTo,
    });
    return { sent: true };
  } catch (e) {
    console.error("[notify] gagal kirim:", e instanceof Error ? e.message : e);
    return { sent: false, reason: "smtp-error" };
  }
}

/** Semua alamat yang harus tahu ada pesanan baru: pemilik + staf admin. */
async function notifyRecipients(): Promise<string[]> {
  const staff = await listStaffEmails();
  return [...new Set([...ownerAllowlist(), ...staff])];
}

const idr = (n: number) => "Rp " + n.toLocaleString("id-ID");

/**
 * Beri tahu tim bahwa ada pesanan baru masuk.
 * Sengaja tidak pernah melempar error — dipanggil setelah pesanan tersimpan,
 * dan pesanan yang sudah sah tidak boleh dibatalkan gara-gara email gagal.
 */
export async function notifyNewOrder(order: {
  code: string;
  total: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  institution: string | null;
  items: { name: string; qty: number }[];
}): Promise<SendResult> {
  const to = await notifyRecipients();

  const daftar = order.items.map((i) => `- ${i.name} x${i.qty}`).join("\n");
  const text = [
    `Pesanan baru masuk di boeminusantara.com`,
    ``,
    `Nomor    : ${order.code}`,
    `Total    : ${idr(order.total)} (termasuk PPN)`,
    `Pembeli  : ${order.buyerName}`,
    order.institution ? `Instansi : ${order.institution}` : null,
    `Telepon  : ${order.buyerPhone}`,
    `Email    : ${order.buyerEmail}`,
    ``,
    `Barang:`,
    daftar,
    ``,
    `Status saat ini: menunggu pembayaran.`,
    `Buka panel: https://www.boeminusantara.com/admin/pesanan`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return sendEmail({
    to,
    subject: `Pesanan baru ${order.code} — ${idr(order.total)}`,
    text,
    // Balas email ini langsung nyambung ke pembelinya.
    replyTo: order.buyerEmail,
  });
}

/** Konfirmasi ke pembeli bahwa pesanannya tercatat. */
export async function notifyBuyerOrderPlaced(order: {
  code: string;
  total: number;
  buyerEmail: string;
}): Promise<SendResult> {
  const text = [
    `Terima kasih, pesanan Anda sudah kami terima.`,
    ``,
    `Nomor pesanan : ${order.code}`,
    `Total         : ${idr(order.total)} (termasuk PPN)`,
    ``,
    `Pantau status pesanan di:`,
    `https://www.boeminusantara.com/pesanan/${order.code}`,
    ``,
    `Tim kami menghubungi Anda untuk konfirmasi pembayaran dan ongkos kirim.`,
    ``,
    `PT. Boemi Nusantara Kaya Berkah`,
    `info@boeminusantara.com`,
  ].join("\n");

  return sendEmail({
    to: [order.buyerEmail],
    subject: `Pesanan ${order.code} diterima — Boemi Nusantara`,
    text,
    // Pembeli yang membalas harus sampai ke kotak surat yang dibaca manusia.
    replyTo: replyToHuman(),
  });
}
