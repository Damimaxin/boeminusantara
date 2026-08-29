import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Repo ini monorepo dgn banyak lockfile — kunci root ke folder boemi.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  // ESLint (config kewarisan monorepo) jangan blokir build produksi.
  // Type-safety tetap dijaga tsc; lint dijalankan terpisah.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Panggilan client-side ke /api/* diteruskan ke boemi-api (dev).
  // Di produksi, nginx yang meng-handle /api → boemi-api. Server-side tetap
  // pakai BOEMI_API_URL langsung (lib/products.ts).
  async rewrites() {
    const api = process.env.BOEMI_API_URL || "http://localhost:4700";
    return [{ source: "/api/:path*", destination: `${api}/:path*` }];
  },
};

export default nextConfig;
