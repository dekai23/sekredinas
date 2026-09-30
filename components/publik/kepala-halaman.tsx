import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PolaGrid } from "./ilustrasi";

/**
 * Banner pembuka untuk halaman-halaman dalam portal publik.
 * Bergaya biru muda ala jabarprov: gelombang warna, pola halus, remah, dan
 * judul besar. Dipakai agar seluruh halaman publik punya "kepala" yang seragam.
 */
export function KepalaHalaman({
  label,
  judul,
  deskripsi,
}: {
  label: string;
  judul: string;
  deskripsi?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-biru-900 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-biru-600 via-biru-800 to-biru-950"
      />
      <PolaGrid className="text-white/10" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-biru-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emas-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <nav aria-label="Remah" className="flex flex-wrap items-center gap-1.5 text-xs text-biru-100/80">
          <Link href="/" className="transition-colors hover:text-white">
            Beranda
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="font-semibold text-white">{label}</span>
        </nav>

        <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight sm:text-4xl">
          {judul}
        </h1>
        {deskripsi ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-biru-100 sm:text-base">
            {deskripsi}
          </p>
        ) : null}
      </div>

      <div aria-hidden className="h-1 w-full bg-gradient-to-r from-emas-400 via-biru-300 to-transparent" />
    </section>
  );
}
