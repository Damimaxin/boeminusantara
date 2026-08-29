import Link from "next/link";
import { ProductForm } from "../_components/ProductForm";
import { createProductAction } from "../actions";

export const metadata = { title: "Tambah Produk" };

export default function NewProductPage() {
  return (
    <div>
      <nav className="mb-4 text-sm text-[var(--color-mute)]">
        <Link href="/admin/produk" className="hover:text-[var(--color-ink)]">
          Produk
        </Link>
        <span className="mx-2">/</span>
        <span>Tambah</span>
      </nav>

      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        Tambah Produk
      </h1>

      <ProductForm action={createProductAction} submitLabel="Simpan Produk" />
    </div>
  );
}
