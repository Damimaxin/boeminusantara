import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Boemi Nusantara — Alat & Perlengkapan Praktik SMK",
    template: "%s · Boemi Nusantara",
  },
  description:
    "Toko alat dan perlengkapan praktik SMK: otomotif, listrik, elektronika, multimedia, tata boga, dan lainnya. Vendor terdaftar, transaksi resmi ber-PPN.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
