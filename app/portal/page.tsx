import Link from "next/link";
import { getPortalUser, listMyQuotes, listMyOrders, getMyProfile } from "@/lib/portal";
import { listDocumentsForRequest } from "@/lib/admin/documents";
import { getPengiriman } from "@/lib/admin/attachments";
import { tahapSekarang } from "@/components/PerjalananPengadaan";
import { assetCareSummary } from "@/lib/assets";
import { BerandaContent, type BarisBerjalan } from "./beranda-content";

export const metadata = { title: "Beranda" };

/** Berkas utama yang biasa diminta panitia pengadaan. */
const DOK_WAJIB = ["SP", "INV", "SJ", "BAST", "KW"];

export default async function PortalHome() {
  const user = (await getPortalUser())!;
  const [quotes, orders, profile, aset] = await Promise.all([
    listMyQuotes(user),
    listMyOrders(user),
    getMyProfile(user),
    assetCareSummary(user),
  ]);

  // Yang masih berjalan saja — transaksi selesai tidak perlu memenuhi beranda.
  const aktif = quotes
    .filter((q) => !["rejected", "expired"].includes(q.status))
    .slice(0, 5);

  const berjalan: BarisBerjalan[] = await Promise.all(
    aktif.map(async (q) => {
      const [dokumen, kirim] = await Promise.all([
        listDocumentsForRequest(q.id),
        getPengiriman(q.id),
      ]);
      const jenis = new Set(dokumen.filter((d) => !d.voidedAt).map((d) => d.docType));

      return {
        id: q.id,
        code: q.code,
        institutionLabel: q.institution ?? "",
        nilai: q.subtotal,
        tahap: tahapSekarang({
          status: q.status,
          adaSuratPesanan: jenis.has("SP"),
          adaResi: Boolean(kirim?.trackingNumber || kirim?.courier),
          sudahDiterima: Boolean(kirim?.receivedAt),
          adaKwitansi: jenis.has("KW"),
        }),
        dokumenTerbit: DOK_WAJIB.filter((j) => jenis.has(j as never)).length,
        dokumenWajib: DOK_WAJIB.length,
      };
    }),
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          {profile.institution || "Beranda"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Ringkasan pengadaan Anda bersama Boemi Nusantara.
        </p>
      </header>

      <BerandaContent
        quotes={quotes}
        orders={orders}
        profile={profile}
        berjalan={berjalan}
        aset={aset}
      />

      {quotes.length === 0 && orders.length === 0 && (
        <section className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Mulai dari sini
          </h2>
          <ol className="mt-3 space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>
              1. Lengkapi{" "}
              <Link
                href="/portal/profil"
                className="text-[var(--color-navy)] hover:underline"
              >
                Profil Instansi
              </Link>{" "}
              — data ini mengisi seluruh dokumen secara otomatis.
            </li>
            <li>
              2. Pilih alat di{" "}
              <Link href="/" className="text-[var(--color-navy)] hover:underline">
                katalog
              </Link>
              , lalu ajukan permintaan penawaran beserta harga yang Anda inginkan.
            </li>
            <li>
              3. Tawar-menawar berlangsung di portal ini, dan seluruh berkasnya
              tersimpan otomatis.
            </li>
          </ol>
        </section>
      )}
    </div>
  );
}
