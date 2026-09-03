"use client";

import { useState } from "react";

type ProductImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
};

export default function ProductImage({
  src,
  alt,
  className = "",
  fill = false,
  width,
  height,
  priority = false,
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  const cleanSrc = (src || "").trim();

  // Reset error state if src prop changes
  if (src !== prevSrc) {
    setPrevSrc(src);
    setError(false);
  }

  // Render clean branded fallback placeholder if src is missing, empty, or failed to load
  if (!cleanSrc || error || cleanSrc === "#") {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 select-none p-4 text-center ${
          fill ? "absolute inset-0 w-full h-full" : ""
        } ${className}`}
        style={!fill && width && height ? { width, height } : undefined}
      >
        <svg
          className="w-12 h-12 mb-2 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider line-clamp-2">
          {alt || "Boemi Nusantara"}
        </span>
        <span className="text-[9px] text-slate-400 mt-0.5">Alat Praktik SMK</span>
      </div>
    );
  }

  return (
    <img
      src={cleanSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading={priority ? "eager" : "lazy"}
      style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
    />
  );
}
