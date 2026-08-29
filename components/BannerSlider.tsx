"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/types";

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (!banners || banners.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white py-4 sm:py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((b) => {
              const slideContent = (
                <div className="relative aspect-[21/9] min-w-full overflow-hidden bg-slate-900 sm:aspect-[24/9]">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6">
                    <h3 className="text-base font-bold text-white sm:text-xl md:text-2xl">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="mt-1 max-w-2xl text-xs text-white/90 sm:text-sm">
                        {b.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );

              return b.link ? (
                <Link key={b.id} href={b.link} className="block min-w-full">
                  {slideContent}
                </Link>
              ) : (
                <div key={b.id} className="block min-w-full">
                  {slideContent}
                </div>
              );
            })}
          </div>

          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Banner Sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2.5 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white sm:left-4"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Banner Berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2.5 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white sm:right-4"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
              {banners.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-6 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
