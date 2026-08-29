"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export type HeroSlide = {
  id: string;
  tag: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  bgGradient: string;
  accentColor: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    tag: "Vendor Resmi Peralatan SMK 2026",
    title: "Perlengkapan Praktik SMK, dari Satu Vendor Tepercaya.",
    description:
      "Solusi lengkap alat otomotif, pengelasan Daiden, kelistrikan TITL, otomasi TOI, multimedia TAV, dan K3 Safety. Transaksi resmi, ber-PPN, pengiriman langsung.",
    buttonText: "Jelajahi Katalog Peralatan",
    buttonLink: "/kategori/tkro",
    bgGradient: "from-slate-900 via-navy-900 to-slate-800",
    accentColor: "bg-red-600",
  },
  {
    id: "slide-2",
    tag: "Distributor & Brand Resmi",
    title: "Katalog Mesin Las & Equipment Daiden Japan.",
    description:
      "Mesin las inverter hemat listrik MMAi 120, MIGi 130, TIGi 160, CUT 40, hingga heavy duty welding equipment garansi resmi untuk lab pengelasan SMK.",
    buttonText: "Lihat Mesin Las Daiden",
    buttonLink: "/cari?q=Daiden",
    bgGradient: "from-red-950 via-slate-900 to-black",
    accentColor: "bg-amber-500",
  },
  {
    id: "slide-3",
    tag: "Standar Keamanan Kerja K3",
    title: "Perlengkapan APD & Keselamatan Kerja 3M Indonesia.",
    description:
      "Chemical suit, masker respirator dual filter, earplug, safety glasses, dan perlengkapan perlindungan standar industri untuk siswa & instruktur SMK.",
    buttonText: "Lihat Produk Safety 3M",
    buttonLink: "/kategori/k3-safety",
    bgGradient: "from-blue-950 via-slate-900 to-black",
    accentColor: "bg-blue-500",
  },
  {
    id: "slide-4",
    tag: "Teknik Instalasi & Otomasi",
    title: "Trainer Kit Kelistrikan TITL, TOI & TAV SMK.",
    description:
      "Alat latih PLC, smart building control, basic electronics trainer kit, audio video system trainer, dan perlengkapan pengujian standar kurikulum.",
    buttonText: "Lihat Trainer Kit Kelistrikan",
    buttonLink: "/kategori/titl",
    bgGradient: "from-emerald-950 via-slate-900 to-black",
    accentColor: "bg-emerald-500",
  },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-slate-900 text-white">
      {/* Slides Slider Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {HERO_SLIDES.map((slide) => (
          <div
            key={slide.id}
            className={`relative min-w-full bg-gradient-to-r ${slide.bgGradient} px-4 py-12 sm:py-16 md:py-20`}
          >
            {/* Background Pattern */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 sm:block opacity-20"
              style={{
                background:
                  "linear-gradient(115deg, transparent 62%, rgba(239,68,68,0.3) 62%, rgba(239,68,68,0.3) 66%, transparent 66%, transparent 70%, rgba(30,58,138,0.3) 70%, rgba(30,58,138,0.3) 74%, transparent 74%)",
              }}
            />

            <div className="relative mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${slide.accentColor}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {slide.tag}
                </span>
              </div>

              <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                {slide.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
                {slide.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href={slide.buttonLink}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {slide.buttonText} &rarr;
                </Link>
                <Link
                  href="/penawaran"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-medium text-slate-200 backdrop-blur transition hover:bg-slate-700 hover:text-white"
                >
                  Minta Surat Penawaran Resmi
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Kanan-Kiri) */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide Hero Sebelumnya"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2.5 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white sm:left-6"
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
        aria-label="Slide Hero Berikutnya"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2.5 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white sm:right-6"
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

      {/* Pagination Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={`hero-dot-${idx}`}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ke Slide ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "w-8 bg-red-600"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
