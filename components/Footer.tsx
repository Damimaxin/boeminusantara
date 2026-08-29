import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)] bg-[var(--color-paper)]">
      {/* Pita Merah-Putih tipis di atas footer */}
      <div aria-hidden className="h-0.5 w-full bg-[var(--color-red)]" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/boemi-mark.png"
                alt="Boemi Nusantara"
                width={62}
                height={35}
                className="h-9 w-auto"
              />
              <p className="text-sm font-semibold tracking-tight text-[var(--color-navy)]">
                BOEMI <span className="font-light text-[var(--color-mute)]">NUSANTARA</span>
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
              PT. Boemi Nusantara Kaya Berkah
            </p>
            <p className="mt-1 max-w-xs text-sm text-[var(--color-mute)]">
              Penyedia alat & perlengkapan praktik SMK. Vendor resmi terdaftar,
              bertransaksi ber-PPN.
            </p>
          </div>
          <div className="text-sm text-[var(--color-mute)]">
            <p className="font-medium text-[var(--color-ink)]">Kontak</p>
            <p className="mt-1 max-w-xs">
              Jl. Hasyim Ashari No. 34 C-D, Cipondoh, Tangerang
            </p>
            <p className="mt-1">
              Telp/Fax:{" "}
              <a
                href="tel:+622155717126"
                className="text-[var(--color-navy)] hover:underline"
              >
                (021) 55717126
              </a>
            </p>
            <p className="mt-1">
              <a
                href="mailto:info@boeminusantara.com"
                className="text-[var(--color-navy)] hover:underline"
              >
                info@boeminusantara.com
              </a>
            </p>
          </div>
          <div className="text-sm text-[var(--color-mute)]">
            <p className="font-medium text-[var(--color-ink)]">Informasi</p>
            <p className="mt-1">
              <Link
                href="/tentang"
                className="text-[var(--color-navy)] hover:underline"
              >
                Tentang &amp; Legalitas
              </Link>
            </p>
            <p className="mt-1">
              <Link
                href="/edukasi"
                className="text-[var(--color-navy)] hover:underline"
              >
                Edukasi &amp; Wawasan
              </Link>
            </p>
            <p className="mt-1">
              <Link href="/magang" className="text-[var(--color-navy)] hover:underline">
                Magang
              </Link>
              <span className="mx-1.5 text-[var(--color-line)]">·</span>
              <Link href="/pelatihan" className="text-[var(--color-navy)] hover:underline">
                Pelatihan
              </Link>
              <span className="mx-1.5 text-[var(--color-line)]">·</span>
              <Link href="/pengaduan" className="text-[var(--color-navy)] hover:underline">
                Pengaduan
              </Link>
            </p>
            <p className="mt-1">Harga belum termasuk PPN.</p>
            <p className="mt-1">Pengiriman ditangani langsung oleh tim kami.</p>
          </div>
        </div>
        <p className="mt-8 text-xs text-[var(--color-mute)]">
          © {new Date().getFullYear()} PT. Boemi Nusantara Kaya Berkah. Seluruh
          hak cipta.
        </p>
      </div>
    </footer>
  );
}
