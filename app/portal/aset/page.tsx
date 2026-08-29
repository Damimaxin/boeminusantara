import Link from "next/link";
import { getPortalUser, listMyQuotes } from "@/lib/portal";
import { listMyAssets } from "@/lib/assets";
import { AssetRow } from "./AssetRow";

export const metadata = { title: "Aset & Perawatan" };

export default async function AsetPage() {
  const user = (await getPortalUser())!;
  const assets = await listMyAssets(user);

  const lewat = assets.filter((a) => a.serviceStatus === "lewat").length;
  const segera = assets.filter((a) => a.serviceStatus === "segera").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Aset &amp; Perawatan
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Alat yang sudah diserahterimakan ke instansi Anda. Daftar ini terisi
          sendiri dari Berita Acara Serah Terima — tidak perlu diketik ulang.
        </p>
      </header>

      {assets.length === 0 ? (
        <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-ink-soft)]">
          <p>Belum ada aset tercatat.</p>
          <p className="mt-2 text-[var(--color-mute)]">
            Begitu sebuah pengadaan selesai dan Berita Acara Serah Terima (BAST)
            terbit, seluruh alatnya otomatis muncul di sini lengkap dengan
            pengingat garansi dan jadwal servis.
          </p>
          <Link
            href="/portal/transaksi"
            className="mt-4 inline-block text-[var(--color-navy)] hover:underline"
          >
            Lihat transaksi berjalan →
          </Link>
        </div>
      ) : (
        <>
          {(lewat > 0 || segera > 0) && (
            <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper-dim)] p-4 text-sm text-[var(--color-ink-soft)]">
              {lewat > 0 && (
                <span className="font-medium text-[var(--color-red-deep)]">
                  {lewat} alat lewat jadwal servis
                </span>
              )}
              {lewat > 0 && segera > 0 && " · "}
              {segera > 0 && <span>{segera} alat perlu servis dalam 30 hari</span>}
              . Perawatan tepat waktu menjaga garansi dan umur alat.
            </div>
          )}

          <ul className="space-y-3">
            {assets.map((a) => (
              <AssetRow key={a.key} asset={a} />
            ))}
          </ul>

          <p className="text-xs text-[var(--color-mute)]">
            Butuh servis, suku cadang, atau kalibrasi?{" "}
            <a
              href="mailto:info@boeminusantara.com?subject=Permintaan%20servis%20alat"
              className="text-[var(--color-navy)] hover:underline"
            >
              Hubungi tim Boemi
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
