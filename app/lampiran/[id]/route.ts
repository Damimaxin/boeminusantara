import { NextResponse, type NextRequest } from "next/server";
import { tautanLampiran, requestIdLampiran } from "@/lib/admin/attachments";
import { checkAdmin } from "@/lib/admin/auth";
import { getPortalUser, getMyQuote } from "@/lib/portal";

/**
 * Unduh lampiran. Berkasnya ada di bucket privat, jadi rute ini yang memeriksa
 * hak akses lalu mengalihkan ke tautan bertanda tangan yang berumur pendek.
 *
 * Tanpa rute ini, satu-satunya cara berbagi berkas adalah membuat bucket-nya
 * publik — dan itu berarti siapa pun yang menebak nama berkas bisa membaca
 * faktur pajak milik sekolah lain.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const requestId = await requestIdLampiran(id);
  if (!requestId) return NextResponse.json({ ok: false }, { status: 404 });

  const gate = await checkAdmin();
  let boleh = gate.ok;

  if (!boleh) {
    const user = await getPortalUser();
    if (user) boleh = (await getMyQuote(user, requestId)) !== null;
  }

  // Bukan haknya → 404, bukan "dilarang".
  if (!boleh) return NextResponse.json({ ok: false }, { status: 404 });

  const url = await tautanLampiran(id);
  if (!url) return NextResponse.json({ ok: false }, { status: 404 });

  return NextResponse.redirect(url);
}
