import Link from "next/link";
import { getActiveBanners } from "@/lib/content";

/**
 * Slot promo beranda, diisi dari CMS (/admin/banner).
 * Tidak ada banner aktif → komponen tidak merender apa pun, beranda tampil
 * seperti sebelumnya. Sengaja begitu: CMS kosong bukan halaman rusak.
 */
export default async function BannerStrip() {
  const banners = await getActiveBanners();
  if (banners.length === 0) return null;

  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => {
            const card = (
              <div className="group relative overflow-hidden rounded border border-[var(--color-line)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image}
                  alt=""
                  className="aspect-[16/9] w-full object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  {b.subtitle && (
                    <p className="mt-0.5 text-xs text-white/85">{b.subtitle}</p>
                  )}
                </div>
              </div>
            );

            return b.link ? (
              <Link key={b.id} href={b.link}>
                {card}
              </Link>
            ) : (
              <div key={b.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
