import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ------------------------------- KARTU ------------------------------- */

export function Kartu({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-navy-100 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function KartuKepala({
  judul,
  deskripsi,
  aksi,
  className,
}: {
  judul: React.ReactNode;
  deskripsi?: React.ReactNode;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-navy-100 px-5 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-base font-bold text-navy-800">{judul}</h2>
        {deskripsi ? <p className="mt-0.5 text-sm text-navy-500">{deskripsi}</p> : null}
      </div>
      {aksi ? <div className="flex items-center gap-2">{aksi}</div> : null}
    </div>
  );
}

export function KartuIsi({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

/* ------------------------------ LENCANA ----------------------------- */

const varianLencana = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      nada: {
        netral: "bg-navy-100 text-navy-700",
        emas: "bg-emas-100 text-emas-700",
        teal: "bg-teal-100 text-teal-700",
        sukses: "bg-emerald-100 text-emerald-700",
        perhatian: "bg-amber-100 text-amber-800",
        bahaya: "bg-red-100 text-red-700",
        gelap: "bg-navy-700 text-white",
      },
    },
    defaultVariants: { nada: "netral" },
  },
);

export interface LencanaProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof varianLencana> {}

export function Lencana({ className, nada, ...props }: LencanaProps) {
  return <span className={cn(varianLencana({ nada }), className)} {...props} />;
}

/* ------------------------------ PESAN -------------------------------- */

export function Pesan({
  nada = "info",
  judul,
  children,
  className,
}: {
  nada?: "info" | "sukses" | "galat" | "perhatian";
  judul?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const gaya = {
    info: "border-navy-200 bg-navy-50 text-navy-800",
    sukses: "border-emerald-200 bg-emerald-50 text-emerald-800",
    galat: "border-red-200 bg-red-50 text-red-800",
    perhatian: "border-amber-200 bg-amber-50 text-amber-900",
  }[nada];

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", gaya, className)} role="status">
      {judul ? <p className="font-semibold">{judul}</p> : null}
      <div className={cn(judul && "mt-0.5")}>{children}</div>
    </div>
  );
}

/* -------------------------- KONDISI KOSONG --------------------------- */

export function KeadaanKosong({
  judul,
  deskripsi,
  aksi,
  ikon,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: React.ReactNode;
  ikon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {ikon ? <div className="mb-1 text-navy-300">{ikon}</div> : null}
      <p className="text-sm font-semibold text-navy-700">{judul}</p>
      {deskripsi ? <p className="max-w-md text-sm text-navy-500">{deskripsi}</p> : null}
      {aksi ? <div className="mt-3">{aksi}</div> : null}
    </div>
  );
}

/* ------------------------------- TABEL ------------------------------- */

/**
 * Tabel data (PRD 4.4): header lengket, zebra, dan pembungkus yang bisa
 * digulir mendatar di layar sempit.
 */
export function TabelPembungkus({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-b-xl", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TabelKepala({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-navy-50 text-left">
      <tr className="border-b border-navy-100">{children}</tr>
    </thead>
  );
}

export function TabelBaris({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">{children}</tr>;
}

export function Sel({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-2.5 align-middle text-navy-700", className)}
      {...props}
    />
  );
}

export function SelKepala({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-navy-600",
        className,
      )}
      {...props}
    />
  );
}

/** Nomor urut kolom; dipakai pada tabel yang tidak punya kolom nomor. */
export function NomorUrut({ nilai }: { nilai: number }) {
  return (
    <span className="font-mono text-xs text-navy-500">{String(nilai).padStart(3, "0")}</span>
  );
}
/* --------------------------- SKELETON MUAT --------------------------- */

export function Kerangka({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-navy-100", className)}
      aria-hidden
      {...props}
    />
  );
}
