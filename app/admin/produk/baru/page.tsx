import Link from "next/link";
import { ProductForm } from "../_components/ProductForm";
import { createProductAction } from "../actions";

export const metadata = { title: "Tambah Produk Baru" };

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-[var(--color-mute)]">
        <Link href="/admin/produk" className="hover:text-[var(--color-ink)]">
          Produk
        </Link>
        <span className="mx-2">/</span>
        <span>Tambah Baru</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">
          Tambah Produk Baru (Publikasi Katalog)
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Isi spesifikasi lengkap, 9 foto produk, 1 video demonstrasi, dan publikasikan ke katalog online Boemi Nusantara.
        </p>
      </div>

      <ProductForm action={createProductAction} submitLabel="🚀 Simpan & Publikasikan Produk" />
    </div>
  );
}
