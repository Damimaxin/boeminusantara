import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/admin/products";
import { ProductForm } from "../_components/ProductForm";
import { updateProductAction } from "../actions";

export const metadata = { title: "Edit Produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  // Bind id ke Server Action (menghasilkan referensi action yang bisa
  // diserialisasi ke client component; signature jadi (prev, formData)).
  const action = updateProductAction.bind(null, id);

  return (
    <div>
      <nav className="mb-4 text-sm text-[var(--color-mute)]">
        <Link href="/admin/produk" className="hover:text-[var(--color-ink)]">
          Produk
        </Link>
        <span className="mx-2">/</span>
        <span>Edit</span>
      </nav>

      <h1 className="mb-1 text-xl font-semibold tracking-tight">
        Edit Produk
      </h1>
      <p className="mb-6 text-sm text-[var(--color-ink-soft)]">
        {product.name}
      </p>

      <ProductForm
        action={action}
        product={product}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
