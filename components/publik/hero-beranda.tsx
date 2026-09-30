"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";

import { sampulKategori, urlSampul } from "./sampul";
import { cn, tanggalPanjang } from "@/lib/utils";

export interface SlideHero {
  id: string;
  judul: string;
  slug: string;
  kategori: string;
  gambarUrl: string | null;
  tanggalTerbit?: string | Date | null;
}

/**
 * Hero beranda bergaya portal pemerintah: latar foto berganti otomatis,
 * judul besar yang tetap, bilah pencarian, kata kunci populer, dan kartu
 * berita unggulan yang mengikuti slide aktif.
 */
export function HeroBeranda({
  judul,
  subjudul,
  slides,
  populer,
}: {
  judul: string;
  subjudul: string;
  slides: SlideHero[];
  populer: string[];
}) {
  const [aktif, setAktif] = useState(0);
  const [jeda, setJeda] = useState(false);
  const jumlah = slides.length;

  useEffect(() => {
    if (jeda || jumlah <= 1) return;
    const timer = setInterval(() => setAktif((n) => (n + 1) % jumlah), 6500);
    return () => clearInterval(timer);
  }, [jeda, jumlah]);

  const geser = (arah: number) => setAktif((n) => (n + arah + jumlah) % jumlah);
  const unggulan = slides[aktif];

  const idx = judul.toLowerCase().indexOf("yahukimo");
  const judulNode =
    idx === -1 ? (
      judul
    ) : (
      <>
        {judul.slice(0, idx)}
        <span className="text-emas-300">{judul.slice(idx, idx + 8)}</span>
        {judul.slice(idx + 8)}
      </>
    );

  return (
    <section className="relative overflow-hidden bg-biru-950 text-white">
      {/* Latar berganti otomatis */}
      <div className="absolute inset-0" aria-hidden>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out",
              i === aktif ? "opacity-100" : "opacity-0",
            )}
            style={{ backgroundImage: `url("${urlSampul(s.judul, s.gambarUrl)}")` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-biru-950 via-biru-950/85 to-biru-900/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-biru-950 via-transparent to-biru-950/30" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div
        className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:pb-28 lg:pt-20"
        onMouseEnter={() => setJeda(true)}
        onMouseLeave={() => setJeda(false)}
      >
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-biru-50 ring-1 ring-white/20 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-emas-300" aria-hidden />
            Portal Resmi Kepegawaian
          </span>

          <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-5xl">
            {judulNode}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-biru-100 sm:text-base">
            {subjudul}
          </p>

          <form
            action="/berita"
            method="get"
            className="mt-7 flex w-full max-w-xl overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl shadow-biru-950/40 ring-1 ring-black/5"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-biru-400"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Cari berita, layanan, atau informasi..."
                aria-label="Pencarian"
                className="h-11 w-full bg-transparent pl-11 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-xl bg-biru-600 px-6 text-sm font-bold text-white transition-colors hover:bg-biru-700"
            >
              Cari
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-biru-200">Populer:</span>
            {populer.map((k) => (
              <Link
                key={k}
                href={`/berita?q=${encodeURIComponent(k)}`}
                className="rounded-full bg-white/10 px-3 py-1 font-medium text-white/90 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
              >
                {k}
              </Link>
            ))}
          </div>
        </div>

        {/* Kartu berita unggulan mengikuti slide aktif */}
        {unggulan ? (
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-biru-950/40 backdrop-blur-md">
              <div
                className="h-40 w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${urlSampul(unggulan.judul, unggulan.gambarUrl)}")` }}
                aria-hidden
              />
              <div className="p-5">
                <span className="inline-flex items-center rounded-full bg-emas-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-biru-950">
                  {sampulKategori(unggulan.kategori).label}
                </span>
                <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-white">
                  {unggulan.judul}
                </h2>
                {unggulan.tanggalTerbit ? (
                  <p className="mt-1 text-xs text-biru-200">
                    {tanggalPanjang(unggulan.tanggalTerbit)}
                  </p>
                ) : null}
                <Link
                  href={`/berita/${unggulan.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emas-300 transition-colors hover:text-emas-200"
                >
                  Baca selengkapnya <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>

                {jumlah > 1 ? (
                  <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
                    <div className="flex gap-1.5">
                      {slides.map((s, i) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setAktif(i)}
                          aria-label={`Ke slide ${i + 1}`}
                          aria-current={i === aktif}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === aktif ? "w-6 bg-emas-300" : "w-1.5 bg-white/40 hover:bg-white/70",
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => geser(-1)}
                        aria-label="Slide sebelumnya"
                        className="rounded-full p-1 text-biru-100 transition-colors hover:bg-white/15 hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => geser(1)}
                        aria-label="Slide berikutnya"
                        className="rounded-full p-1 text-biru-100 transition-colors hover:bg-white/15 hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Lengkung pemisah ke bagian putih */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-10">
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0 40h1440V14c-240 18-480 26-720 14S240 4 0 14z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
