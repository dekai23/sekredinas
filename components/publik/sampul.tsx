import {
  Award,
  BookOpen,
  GraduationCap,
  Images,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Sampul berita/kegiatan.
 *
 * Bila `gambarUrl` berupa URL gambar (http/https), gambar ditampilkan. Bila
 * tidak, dipakai sampul abstrak bergradient sesuai kategori - ringan, tajam,
 * dan tidak butuh koneksi internet (penting untuk portal daerah).
 */
export interface KonfigurasiSampul {
  label: string;
  dari: string;
  ke: string;
  ikon: LucideIcon;
}

export const SAMPUL_KATEGORI: Record<string, KonfigurasiSampul> = {
  berita: {
    label: "Berita",
    dari: "from-biru-700",
    ke: "to-biru-950",
    ikon: Newspaper,
  },
  kegiatan: {
    label: "Kegiatan",
    dari: "from-biru-500",
    ke: "to-biru-800",
    ikon: Images,
  },
  artikel: {
    label: "Artikel",
    dari: "from-biru-600",
    ke: "to-teal-700",
    ikon: BookOpen,
  },
  diklat: {
    label: "Diklat",
    dari: "from-biru-400",
    ke: "to-biru-700",
    ikon: GraduationCap,
  },
  prestasi: {
    label: "Prestasi",
    dari: "from-emas-500",
    ke: "to-biru-800",
    ikon: Award,
  },
};

export function sampulKategori(kategori: string | null | undefined): KonfigurasiSampul {
  return SAMPUL_KATEGORI[kategori ?? ""] ?? SAMPUL_KATEGORI.kegiatan;
}

/** URL gambar sampul: gambar asli bila ada, atau foto placeholder deterministik. */
export function urlSampul(judul: string, gambarUrl?: string | null): string {
  if (gambarUrl && /^https?:\/\//i.test(gambarUrl)) return gambarUrl;
  return `https://picsum.photos/seed/${encodeURIComponent(judul).slice(0, 60)}/900/600`;
}

export function SampulBerita({
  kategori,
  judul,
  gambarUrl,
  className,
}: {
  kategori: string | null | undefined;
  judul: string;
  gambarUrl?: string | null;
  className?: string;
}) {
  const konfigurasi = sampulKategori(kategori);
  const Ikon = konfigurasi.ikon;
  const url = urlSampul(judul, gambarUrl);

  return (
    <span
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        konfigurasi.dari,
        konfigurasi.ke,
        className,
      )}
      role="img"
      aria-label={`Sampul ${konfigurasi.label}: ${judul}`}
    >
      {/* Foto (asli atau placeholder). Bila gagal muat, gradien tetap tampil. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${url}")` }}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-biru-950/80 via-biru-950/30 to-transparent"
      />
      <span className="relative flex flex-col items-center gap-2 text-white">
        <Ikon className="h-9 w-9 opacity-90" aria-hidden />
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
          <Sparkles className="h-3 w-3" aria-hidden />
          {konfigurasi.label}
        </span>
      </span>
    </span>
  );
}
