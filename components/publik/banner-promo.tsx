"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  IdCard,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Banner {
  label: string;
  judul: string;
  ringkasan: string;
  href: string;
  cta: string;
  dari: string;
  ke: string;
  gambar: string;
  Ikon: typeof FileText;
}

/** Banner promo contoh (dummy) - nanti bisa diganti gambar/foto asli. */
const BANNER: Banner[] = [
  {
    label: "Layanan",
    judul: "Kenaikan Pangkat ASN",
    ringkasan: "Syarat, dokumen, dan tahapan pengusulan periode April & Oktober.",
    href: "/layanan",
    cta: "Lihat layanan",
    dari: "from-navy-800",
    ke: "to-navy-950",
    gambar: "https://picsum.photos/seed/bkpsdm-pangkat/1200/500",
    Ikon: IdCard,
  },
  {
    label: "Aplikasi",
    judul: "Mengenal SekreDinas",
    ringkasan: "Persuratan, disposisi, arsip, dan kepegawaian dalam satu sistem.",
    href: "/berita",
    cta: "Baca informasi",
    dari: "from-teal-600",
    ke: "to-navy-800",
    gambar: "https://picsum.photos/seed/bkpsdm-aplikasi/1200/500",
    Ikon: FileText,
  },
  {
    label: "Diklat",
    judul: "Jadwal Bimtek & Pelatihan",
    ringkasan: "Ikuti agenda pengembangan kompetensi ASN terbaru.",
    href: "/agenda",
    cta: "Lihat agenda",
    dari: "from-emas-600",
    ke: "to-navy-900",
    gambar: "https://picsum.photos/seed/bkpsdm-diklat/1200/500",
    Ikon: GraduationCap,
  },
];

/** Carousel banner promo di beranda; berganti otomatis tiap 5 detik. */
export function BannerPromo() {
  const [aktif, setAktif] = useState(0);
  const [jeda, setJeda] = useState(false);
  const jumlah = BANNER.length;

  useEffect(() => {
    if (jeda || jumlah <= 1) return;
    const t = setInterval(() => setAktif((n) => (n + 1) % jumlah), 5000);
    return () => clearInterval(t);
  }, [jeda, jumlah]);

  const geser = (a: number) => setAktif((n) => (n + a + jumlah) % jumlah);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
    >
      <div className="relative h-44 sm:h-52">
        {BANNER.map((b, i) => {
          const Ikon = b.Ikon;
          return (
            <Link
              key={b.judul}
              href={b.href}
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition-opacity duration-700",
                b.dari,
                b.ke,
                i === aktif ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={i !== aktif}
            >
              <img
                src={b.gambar}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-900/30"
              />
              <span
                aria-hidden
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              />
              <span className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden />
              <span className="relative flex h-full flex-col justify-center gap-2 px-6 sm:px-10">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  {b.label}
                </span>
                <span className="max-w-xl text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {b.judul}
                </span>
                <span className="hidden max-w-lg text-sm text-white/85 sm:block">
                  {b.ringkasan}
                </span>
                <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-navy-800">
                  <Ikon className="h-4 w-4" aria-hidden />
                  {b.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {jumlah > 1 ? (
        <>
          <button
            type="button"
            onClick={() => geser(-1)}
            aria-label="Banner sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-white/30 focus:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => geser(1)}
            aria-label="Banner berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-white/30 focus:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {BANNER.map((b, i) => (
              <button
                key={b.judul}
                type="button"
                onClick={() => setAktif(i)}
                aria-label={`Ke banner ${i + 1}`}
                aria-current={i === aktif}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === aktif ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
