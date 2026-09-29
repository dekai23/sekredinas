"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { SampulBerita, sampulKategori } from "./sampul";
import { cn } from "@/lib/utils";

export interface SlideBerita {
  id: string;
  judul: string;
  ringkasan: string | null;
  slug: string;
  kategori: string;
  gambarUrl: string | null;
  tanggalTerbit: string;
}

/**
 * Carousel kegiatan di bagian awal beranda. Berganti otomatis setiap 6 detik,
 * dapat digeser manual, dan berhenti sejenak saat kursor berada di atasnya.
 */
export function HeroCarousel({ slides }: { slides: SlideBerita[] }) {
  const [aktif, setAktif] = useState(0);
  const [jeda, setJeda] = useState(false);
  const jumlah = slides.length;

  useEffect(() => {
    if (jeda || jumlah <= 1) return;
    const timer = setInterval(() => {
      setAktif((n) => (n + 1) % jumlah);
    }, 6000);
    return () => clearInterval(timer);
  }, [jeda, jumlah]);

  if (jumlah === 0) return null;

  const geser = (arah: number) => setAktif((n) => (n + arah + jumlah) % jumlah);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-navy-100 bg-navy-900 shadow-xl"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
    >
      {/* Panggung slide */}
      <div className="relative h-[360px] w-full sm:h-[420px] lg:h-[460px]">
        {slides.map((s, i) => {
          const konfigurasi = sampulKategori(s.kategori);
          return (
            <div
              key={s.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out",
                i === aktif ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={i !== aktif}
            >
              <SampulBerita
                kategori={s.kategori}
                judul={s.judul}
                gambarUrl={s.gambarUrl}
                className="h-full w-full"
              />
              {/* Overlay agar teks terbaca */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-900/20" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emas-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-950">
                  {konfigurasi.label}
                </span>
                <h2 className="mt-3 max-w-2xl text-xl font-extrabold leading-tight text-white sm:text-3xl">
                  {s.judul}
                </h2>
                {s.ringkasan ? (
                  <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-navy-100 sm:block">
                    {s.ringkasan}
                  </p>
                ) : null}
                <Link
                  href={`/berita/${s.slug}`}
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-navy-800 transition-colors hover:bg-emas-400 hover:text-navy-950"
                >
                  Baca selengkapnya
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigasi kiri/kanan */}
      {jumlah > 1 ? (
        <>
          <button
            type="button"
            onClick={() => geser(-1)}
            aria-label="Slide sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white opacity-0 backdrop-blur transition-opacity hover:bg-white/25 focus:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => geser(1)}
            aria-label="Slide berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white opacity-0 backdrop-blur transition-opacity hover:bg-white/25 focus:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Titik indikator */}
          <div className="absolute bottom-4 right-5 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAktif(i)}
                aria-label={`Ke slide ${i + 1}`}
                aria-current={i === aktif}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === aktif ? "w-6 bg-emas-400" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
