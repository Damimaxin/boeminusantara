import "server-only";
import { getAdminSupabase } from "@/lib/admin/supabase-admin";

/**
 * Data-access ADMIN untuk RFQ / penawaran. Berbicara ke boemi-api (Fastify)
 * server-side. Bila API/DB kosong → resilient: kembalikan array kosong / null
 * (mode preview). Tidak pernah melempar ke UI.
 */

const API_URL = process.env.BOEMI_API_URL || "http://localhost:4700";

/**
 * Header kunci internal. boemi-api dilayani publik lewat nginx /api, jadi
 * endpoint yang mengembalikan data pelanggan (list/detail penawaran, approve,
 * status) dikunci: hanya server ini yang tahu kuncinya. Tanpa ini, siapa pun
 * bisa memanggil GET /api/quotes dan menarik nama+email+telepon semua pemohon.
 */
const internalHeaders = (extra: Record<string, string> = {}) => {
  const key = process.env.INTERNAL_API_KEY;
  return key ? { ...extra, "x-internal-key": key } : extra;
};

export type QuoteItem = {
  id: string;
  name: string;
  price: number; // exclude PPN
  qty: number;
  subtotal: number;
};

export type QuoteRequest = {
  id: string;
  code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  institution: string | null;
  note: string | null;
  status: "pending" | "reviewed" | "quoted" | "rejected" | "expired";
  created_at: string;
  quote_request_items?: QuoteItem[];
};

export type Quotation = {
  id: string;
  request_id: string;
  code: string;
  subtotal: number;
  discount: number;
  ppn_enabled: boolean;
  ppn_amount: number;
  total: number;
  valid_until: string | null;
  terms: string | null;
  status: "draft" | "approved" | "sent";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  quote_requests?: QuoteRequest;
};

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      headers: internalHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Daftar permintaan penawaran. Kosong bila API/DB belum siap. */
export async function listQuotes(): Promise<QuoteRequest[]> {
  const data = await apiGet<{ quotes: QuoteRequest[] }>("/quotes");
  return data?.quotes ?? [];
}

/** Detail satu permintaan (dengan item). Null bila tak ada / API mati. */
export async function getQuote(id: string): Promise<QuoteRequest | null> {
  const data = await apiGet<{ quote: QuoteRequest }>(
    `/quotes/${encodeURIComponent(id)}`,
  );
  return data?.quote ?? null;
}

/** Surat penawaran (quotation) untuk render, by quotation-id. Null bila belum ada. */
export async function getQuotation(id: string): Promise<Quotation | null> {
  const data = await apiGet<{ quotation: Quotation }>(
    `/quotations/${encodeURIComponent(id)}`,
  );
  return data?.quotation ?? null;
}

/** Surat penawaran terbaru untuk sebuah permintaan (RFQ), by request-id. */
export async function getQuotationByRequest(
  requestId: string,
): Promise<Quotation | null> {
  const data = await apiGet<{ quotation: Quotation }>(
    `/quotes/${encodeURIComponent(requestId)}/quotation`,
  );
  return data?.quotation ?? null;
}

export type ApproveInput = {
  discount?: number;
  ppnEnabled: boolean;
  validUntil?: string | null;
  terms?: string | null;
  approvedBy?: string | null;
};

export type ApproveResult =
  | { ok: true; id: string; code: string }
  | { ok: false; error: string };

/** ACC permintaan → terbitkan surat. Kembalikan id/kode surat baru. */
export async function approveQuote(
  requestId: string,
  input: ApproveInput,
): Promise<ApproveResult> {
  try {
    const res = await fetch(
      `${API_URL}/quotes/${encodeURIComponent(requestId)}/approve`,
      {
        method: "POST",
        headers: internalHeaders({ "content-type": "application/json" }),
        body: JSON.stringify(input),
        cache: "no-store",
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      code?: string;
      error?: string;
    };
    if (!res.ok || !data.id || !data.code) {
      return { ok: false, error: data.error || `http_${res.status}` };
    }
    return { ok: true, id: data.id, code: data.code };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Ubah status permintaan (reviewed/rejected/…). */
export async function setQuoteStatus(
  requestId: string,
  status: QuoteRequest["status"],
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_URL}/quotes/${encodeURIComponent(requestId)}/status`,
      {
        method: "PATCH",
        headers: internalHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ status }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type RequestItemRow = {
  id: string;
  name: string;
  qty: number;
  /** Harga katalog saat permintaan dibuat, exclude PPN. */
  price: number;
  /** Harga yang diminta pembeli, null bila tidak mengisi. */
  buyerPrice: number | null;
};

/** Rincian barang satu permintaan penawaran — dipakai layar negosiasi. */
export async function listRequestItems(requestId: string): Promise<RequestItemRow[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("quote_request_items")
    .select("id, name, qty, price, buyer_price")
    .eq("request_id", requestId);

  if (error || !data) return [];

  return (
    data as {
      id: string;
      name: string;
      qty: number;
      price: number;
      buyer_price: number | null;
    }[]
  ).map((r) => ({
    id: r.id,
    name: r.name,
    qty: r.qty,
    price: r.price,
    buyerPrice: r.buyer_price,
  }));
}
