import { cn } from "@/lib/utils";

/**
 * Ilustrasi abstrak bertema aparatur / kepegawaian, dibuat murni dari SVG
 * sehingga ringan, tajam di semua resolusi, dan tidak memerlukan internet
 * (portal harus tetap cepat diakses dari Yahukimo).
 *
 * Semua ilustrasi bersifat dekoratif (aria-hidden) - makna tetap di teks.
 */

/** Latar grid samar untuk section gelap/terang. */
export function PolaGrid({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <pattern id="pola-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path
            d="M32 0H0v32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.18"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pola-grid)" />
    </svg>
  );
}

/**
 * Komposisi hero: jaringan aparatur, dokumen, dan busur pertumbuhan.
 * Warna mengikuti token navy/emas/teal.
 */
export function AbstrakAparatur({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 520"
      role="img"
      aria-label="Ilustrasi aparatur dan tata kelola kepegawaian"
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id="grad-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(218 68% 30%)" />
          <stop offset="100%" stopColor="hsl(219 64% 14%)" />
        </linearGradient>
        <linearGradient id="grad-emas" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(45 90% 62%)" />
          <stop offset="100%" stopColor="hsl(42 92% 50%)" />
        </linearGradient>
        <linearGradient id="grad-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(190 82% 52%)" />
          <stop offset="100%" stopColor="hsl(194 70% 34%)" />
        </linearGradient>
        <radialGradient id="grad-glow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="hsl(190 85% 60%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(190 85% 60%)" stopOpacity="0" />
        </radialGradient>
        <filter id="blur-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <circle cx="360" cy="210" r="190" fill="url(#grad-glow)" />

      {/* Busur orbit / struktur organisasi */}
      <g fill="none" stroke="hsl(218 68% 40%)" strokeOpacity="0.35">
        <circle cx="360" cy="220" r="150" />
        <circle cx="360" cy="220" r="108" strokeDasharray="4 10" />
      </g>

      {/* Kartu utama (dokumen digital) */}
      <g transform="translate(210 96)">
        <rect
          x="0"
          y="0"
          width="300"
          height="250"
          rx="26"
          fill="url(#grad-navy)"
        />
        <rect x="26" y="30" width="120" height="14" rx="7" fill="hsl(45 90% 62%)" opacity="0.95" />
        <rect x="26" y="60" width="248" height="10" rx="5" fill="hsl(215 60% 96%)" opacity="0.55" />
        <rect x="26" y="82" width="210" height="10" rx="5" fill="hsl(215 60% 96%)" opacity="0.35" />
        <rect x="26" y="104" width="232" height="10" rx="5" fill="hsl(215 60% 96%)" opacity="0.35" />

        {/* Grafik batang pertumbuhan */}
        <g transform="translate(26 140)">
          <rect x="0" y="42" width="26" height="32" rx="6" fill="hsl(190 82% 52%)" />
          <rect x="40" y="26" width="26" height="48" rx="6" fill="hsl(190 82% 52%)" opacity="0.8" />
          <rect x="80" y="12" width="26" height="62" rx="6" fill="hsl(45 90% 58%)" />
          <rect x="120" y="0" width="26" height="74" rx="6" fill="hsl(45 90% 58%)" opacity="0.85" />
        </g>

        {/* Baris tabel samar */}
        <g transform="translate(26 224)">
          <rect x="0" y="0" width="60" height="8" rx="4" fill="hsl(215 60% 96%)" opacity="0.30" />
          <rect x="120" y="0" width="60" height="8" rx="4" fill="hsl(215 60% 96%)" opacity="0.30" />
          <rect x="200" y="0" width="74" height="8" rx="4" fill="hsl(215 60% 96%)" opacity="0.30" />
        </g>
      </g>

      {/* Noda warna lembut di belakang */}
      <circle cx="150" cy="380" r="60" fill="url(#grad-emas)" opacity="0.22" filter="url(#blur-soft)" />
      <circle cx="520" cy="120" r="70" fill="url(#grad-teal)" opacity="0.25" filter="url(#blur-soft)" />

      {/* Simpul jaringan ASN */}
      {[
        [360, 70],
        [470, 140],
        [470, 300],
        [360, 370],
        [250, 300],
        [250, 140],
      ].map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <line
            x1="360"
            y1="220"
            x2={x}
            y2={y}
            stroke="hsl(218 60% 45%)"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <circle
            cx={x}
            cy={y}
            r={i % 2 === 0 ? 16 : 12}
            fill={i % 2 === 0 ? "hsl(45 90% 56%)" : "hsl(190 82% 50%)"}
            stroke="white"
            strokeWidth="3"
          />
        </g>
      ))}

      {/* Pusat jaringan: aparatur */}
      <g transform="translate(360 220)">
        <circle r="46" fill="white" />
        <circle r="46" fill="none" stroke="hsl(218 68% 30%)" strokeWidth="2" opacity="0.2" />
        {/* Kepala */}
        <circle cx="0" cy="-14" r="13" fill="url(#grad-navy)" />
        {/* Badan / jas */}
        <path
          d="M-22 24c0-13 10-22 22-22s22 9 22 22v6h-44z"
          fill="url(#grad-navy)"
        />
        {/* Dasi emas */}
        <path d="M-4 -2h8l-2 12-2 6-2-6z" fill="url(#grad-emas)" />
      </g>
    </svg>
  );
}

/** Ornamen ringkas untuk kartu/section: simpul kepegawaian. */
export function OrnamenAparatur({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id="orn-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(218 68% 30%)" />
          <stop offset="100%" stopColor="hsl(219 64% 16%)" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="hsl(218 60% 45%)" strokeOpacity="0.25" strokeDasharray="3 8" />
      <circle cx="100" cy="100" r="60" fill="url(#orn-navy)" />
      <circle cx="100" cy="82" r="18" fill="hsl(45 90% 58%)" />
      <path d="M64 138c0-20 16-34 36-34s36 14 36 34z" fill="hsl(45 90% 58%)" />
    </svg>
  );
}

/** Latar gelombang navy untuk hero, dipakai sebagai pengganti foto. */
export function GelombangNavy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id="gel-navy" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(219 64% 14%)" />
          <stop offset="55%" stopColor="hsl(218 68% 22%)" />
          <stop offset="100%" stopColor="hsl(194 70% 26%)" />
        </linearGradient>
      </defs>
      <rect width="1440" height="320" fill="url(#gel-navy)" />
      <path
        d="M0 224l60-16c60-16 180-48 300-42s240 58 360 58 240-64 360-74 240 22 300 32l60 10v128H0z"
        fill="hsl(219 64% 14%)"
        opacity="0.45"
      />
    </svg>
  );
}
