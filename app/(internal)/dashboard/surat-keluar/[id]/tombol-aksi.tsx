"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Printer, Send, Undo2 } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";

import { ajukanPersetujuan, kembalikanSurat, setujuiSurat } from "../aksi";

/**
 * Panel tindakan surat keluar: ajukan persetujuan, setujui, atau kembalikan.
 * Mencetak memakai dialog peramban sehingga tidak memerlukan pustaka PDF.
 */
export function TombolAjukan({
  id,
  bolehAjukan,
  bolehSetujui,
}: {
  id: string;
  bolehAjukan: boolean;
  bolehSetujui: boolean;
}) {
  const [sibuk, mulai] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tampilCatatan, setTampilCatatan] = useState(false);

  const jalankan = (
    aksi: () => Promise<{ sukses?: string; galat?: string }>,
    sukses: string,
  ) => {
    mulai(async () => {
      setPesan(null);
      setGalat(null);
      const hasil = await aksi();
      if (hasil.galat) setGalat(hasil.galat);
      else setPesan(hasil.sukses ?? sukses);
    });
  };

  return (
    <div className="space-y-3">
      {pesan ? <Pesan nada="sukses">{pesan}</Pesan> : null}
      {galat ? <Pesan nada="galat">{galat}</Pesan> : null}

      <div className="flex flex-wrap gap-2">
        {bolehAjukan ? (
          <Tombol
            ukuran="kecil"
            disabled={sibuk}
            onClick={() =>
              jalankan(
                () => ajukanPersetujuan(id),
                "Surat diajukan dan sudah mendapat nomor.",
              )
            }
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Ajukan persetujuan
          </Tombol>
        ) : null}

        {bolehSetujui ? (
          <Tombol
            varian="aksen"
            ukuran="kecil"
            disabled={sibuk}
            onClick={() =>
              jalankan(() => setujuiSurat(id, ""), "Surat disetujui dan dikunci.")
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Setujui
          </Tombol>
        ) : null}

        {bolehSetujui ? (
          <Tombol
            varian="garis"
            ukuran="kecil"
            onClick={() => setTampilCatatan((v) => !v)}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            Kembalikan untuk diperbaiki
          </Tombol>
        ) : null}

        <Tombol
          varian="halus"
          ukuran="kecil"
          onClick={() => window.print()}
          className="ml-auto"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Cetak naskah
        </Tombol>
      </div>

      {tampilCatatan ? (
        <form
          className="space-y-2 border-t border-navy-100 pt-3"
          action={(formData) =>
            jalankan(
              () => kembalikanSurat(id, String(formData.get("catatan") ?? "")),
              "Surat dikembalikan kepada pembuat.",
            )
          }
        >
          <BarisForm label="Alasan pengembalian" wajib htmlFor="catatan">
            <Textarea id="catatan" name="catatan" required rows={2} maxLength={1000} />
          </BarisForm>
          <Tombol type="submit" varian="bahaya" ukuran="kecil" disabled={sibuk}>
            Kembalikan surat
          </Tombol>
        </form>
      ) : null}
    </div>
  );
}
