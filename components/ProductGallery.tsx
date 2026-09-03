"use client";

import { useState, useEffect } from "react";
import ProductImage from "@/components/ProductImage";

type ProductGalleryProps = {
  name: string;
  image: string | null;
  images?: string[];
  video?: string | null;
};

type ActiveMedia =
  | { type: "image"; url: string; index: number }
  | { type: "video"; url: string };

function formatYouTubeEmbed(url: string): string {
  if (!url) return url;
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/").split("&")[0];
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

export default function ProductGallery({
  name,
  image,
  images = [],
  video,
}: ProductGalleryProps) {
  // Aggregate all unique image URLs
  const allImages: string[] = [];
  if (image && image.trim()) allImages.push(image.trim());
  if (Array.isArray(images)) {
    for (const img of images) {
      if (img && typeof img === "string" && img.trim() && !allImages.includes(img.trim())) {
        allImages.push(img.trim());
      }
    }
  }

  const hasVideo = Boolean(video && video.trim());
  const cleanVideo = video?.trim() ?? "";

  const [activeMedia, setActiveMedia] = useState<ActiveMedia>(
    allImages.length > 0
      ? { type: "image", url: allImages[0], index: 0 }
      : hasVideo
      ? { type: "video", url: cleanVideo }
      : { type: "image", url: "", index: 0 }
  );

  // Sync activeMedia if image/images props change dynamically
  useEffect(() => {
    if (allImages.length > 0) {
      setActiveMedia({ type: "image", url: allImages[0], index: 0 });
    } else if (hasVideo) {
      setActiveMedia({ type: "video", url: cleanVideo });
    }
  }, [image, JSON.stringify(images), video]);

  const isYouTube =
    cleanVideo.includes("youtube.com") || cleanVideo.includes("youtu.be");

  return (
    <div className="space-y-4">
      {/* Main Viewport */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dim)] flex items-center justify-center">
        {activeMedia.type === "image" ? (
          <ProductImage
            key={activeMedia.url}
            src={activeMedia.url}
            alt={`${name} - Foto ${activeMedia.index + 1}`}
            fill
            priority
            className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-black flex items-center justify-center">
            {isYouTube ? (
              <iframe
                src={formatYouTubeEmbed(cleanVideo)}
                title={`${name} Video Demo`}
                className="h-full w-full aspect-square"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={cleanVideo}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            )}
          </div>
        )}

        {/* Media Badge */}
        {activeMedia.type === "image" && allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {activeMedia.index + 1} / {allImages.length}
          </div>
        )}

        {activeMedia.type === "video" && (
          <div className="absolute top-3 left-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white shadow">
            🎬 Video Demonstrasi
          </div>
        )}
      </div>

      {/* Thumbnails Navigation (Photos + Video) */}
      {(allImages.length > 1 || hasVideo) && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {/* Photo Thumbnails */}
          {allImages.map((url, idx) => {
            const isSelected =
              activeMedia.type === "image" && activeMedia.index === idx;
            return (
              <button
                key={`photo-${idx}`}
                type="button"
                onClick={() =>
                  setActiveMedia({ type: "image", url, index: idx })
                }
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white transition ${
                  isSelected
                    ? "border-[var(--color-navy)] ring-2 ring-[var(--color-navy)]/30 scale-105"
                    : "border-[var(--color-line)] opacity-70 hover:opacity-100"
                }`}
                title={`Foto ${idx + 1}`}
              >
                <ProductImage
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
                  #{idx + 1}
                </span>
              </button>
            );
          })}

          {/* Video Thumbnail */}
          {hasVideo && (
            <button
              type="button"
              onClick={() =>
                setActiveMedia({ type: "video", url: cleanVideo })
              }
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-purple-950 text-white flex flex-col items-center justify-center transition ${
                activeMedia.type === "video"
                  ? "border-purple-600 ring-2 ring-purple-400 scale-105"
                  : "border-purple-300 opacity-80 hover:opacity-100"
              }`}
              title="Tonton Video Produk"
            >
              <span className="text-xl">▶</span>
              <span className="text-[9px] font-bold tracking-tight text-purple-200">
                VIDEO
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
