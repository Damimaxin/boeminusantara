"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "../actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteProductAction(id);
      if (res && !res.ok) {
        alert(res.error || "Gagal menghapus produk.");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus produk.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition disabled:opacity-50"
      title="Hapus Produk"
    >
      {isDeleting ? "..." : "🗑️ Hapus"}
    </button>
  );
}
