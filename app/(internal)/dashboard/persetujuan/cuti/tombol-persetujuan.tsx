"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { Textarea } from "@/components/ui/formulir";
import type { HasilForm } from "@/lib/validasi/konten";

import { setujuiCuti, tolakCuti } from "./aksi";

/** Kontrol persetujuan/penolakan cuti dengan catatan (PRD 6.G). */
export function KontrolPersetujuan({ id }: { id: string }) {
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState<HasilForm | null>(null);
  const [pending, mulai] = useTransition();

  const jalankan = (aksi: (id: string, catatan: string) => Promise<HasilForm>) => {
    setPesan(null);
    mulai(async () => {
      const hasil = await aksi(id, catatan);
      setPesan(hasil);
    });
  };

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        rows={2}
        placeholder="Catatan persetujuan / alasan penolakan..."
        aria-label="Catatan"
      />
      {pesan?.galat ? <p className="text-xs font-medium text-red-600">{pesan.galat}</p> : null}
      {pesan?.sukses ? <p className="text-xs font-medium text-emerald-700">{pesan.sukses}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => jalankan(setujuiCuti)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" aria-hidden />
          Setujui
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => jalankan(tolakCuti)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden />
          Tolak
        </button>
      </div>
    </div>
  );
}
