"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import type { HasilForm } from "@/lib/validasi/konten";

/**
 * Tombol hapus generik. Menerima server action dari komponen server melalui
 * prop `aksi` (server action boleh dikirim sebagai prop ke client component).
 */
export function TombolHapus({
  aksi,
  id,
  label = "Hapus",
  konfirmasi = "Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
}: {
  aksi: (id: string) => Promise<HasilForm>;
  id: string;
  label?: string;
  konfirmasi?: string;
}) {
  const [pending, mulai] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(konfirmasi)) return;
          setGalat(null);
          mulai(async () => {
            const hasil = await aksi(id);
            if (hasil.galat) setGalat(hasil.galat);
          });
        }}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {pending ? "Menghapus..." : label}
      </button>
      {galat ? <span className="text-xs text-red-600">{galat}</span> : null}
    </span>
  );
}
