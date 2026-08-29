import type { NextRequest } from "next/server";

/**
 * Alamat publik situs untuk membangun URL pengalihan.
 *
 * `new URL(request.url).origin` TIDAK bisa dipakai: aplikasi berjalan di balik
 * nginx, jadi yang terbaca adalah alamat internal (http://localhost:3000).
 * Pengalihan ke sana membuat tautan email/login mati total di sisi pengguna.
 *
 * Urutan sumber: header dari proxy → env → domain produksi.
 */
export function publicOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";

  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  if (host) return `${proto}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boeminusantara.com";
}
