import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const varianTombol = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-navy-500 focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      varian: {
        utama: "bg-navy-700 text-white hover:bg-navy-800 active:bg-navy-900",
        aksen: "bg-teal-500 text-white hover:bg-teal-600",
        emas: "bg-emas-500 text-navy-900 hover:bg-emas-400",
        garis: "border border-navy-200 bg-white text-navy-700 hover:bg-navy-50",
        bayang: "bg-navy-600 text-white hover:bg-navy-700",
        halus: "text-navy-700 hover:bg-navy-50",
        bahaya: "bg-red-600 text-white hover:bg-red-700",
      },
      ukuran: {
        kecil: "h-8 px-3 text-xs",
        sedang: "h-10 px-4",
        besar: "h-12 px-6 text-base",
        penuh: "h-10 w-full px-4",
        ikon: "h-9 w-9",
      },
    },
    defaultVariants: { varian: "utama", ukuran: "sedang" },
  },
);

export interface TombolProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof varianTombol> {}

/** Tombol dasar aplikasi. */
export function Tombol({ className, varian, ukuran, ...props }: TombolProps) {
  return <button className={cn(varianTombol({ varian, ukuran }), className)} {...props} />;
}

export { varianTombol };
