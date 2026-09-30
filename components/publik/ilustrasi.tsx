import { cn } from "@/lib/utils";

/**
 * Ilustrasi abstrak untuk portal publik, dibuat murni dari SVG sehingga ringan,
 * tajam di semua resolusi, dan tidak memerlukan internet (portal harus tetap
 * cepat diakses dari Yahukimo). Semua ilustrasi bersifat dekoratif (aria-hidden).
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
