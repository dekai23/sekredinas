"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileUp, Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/konten";

import { unggahArsip } from "./aksi";

interface Props {
  unit: Array<{ id: string; nama: string }>;
  kategoriUmum: string[];
  tahunIni: number;
}

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Mengunggah...
        </>
      ) : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          Simpan arsip
        </>
      )}
    </Tombol>
  );
}

/** Formulir unggah arsip digital (PRD 6.E). */
export function FormArsip({ unit, kategoriUmum, tahunIni }: Props) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(unggahArsip, null);
  const [namaBerkas, setNamaBerkas] = useState("");

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {hasil?.galat ? (
        <Pesan nada="galat" judul="Unggahan gagal">
          {hasil.galat}
        </Pesan>
      ) : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <BarisForm label="Judul arsip" wajib htmlFor="judul" galat={hasil?.field?.judul}>
          <Input
            id="judul"
            name="judul"
            required
            maxLength={200}
            placeholder="mis. SK Kenaikan Pangkat Periode April 2026"
          />
        </BarisForm>

        <BarisForm
          label="Kategori"
          htmlFor="kategori"
          galat={hasil?.field?.kategori}
          petunjuk="Bebas, mis. Surat Keputusan, SK, Laporan."
        >
          <Input
            id="kategori"
            name="kategori"
            list="daftar-kategori-arsip"
            maxLength={100}
            placeholder="mis. Surat Keputusan"
          />
          <datalist id="daftar-kategori-arsip">
            {kategoriUmum.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </BarisForm>

        <BarisForm label="Kode klasifikasi" htmlFor="kodeKlasifikasi" galat={hasil?.field?.kodeKlasifikasi}>
          <Input id="kodeKlasifikasi" name="kodeKlasifikasi" maxLength={50} placeholder="mis. 3.1.1" />
        </BarisForm>

        <BarisForm label="Tahun" htmlFor="tahun" galat={hasil?.field?.tahun}>
          <Input id="tahun" name="tahun" type="number" min={1900} max={2200} defaultValue={tahunIni} />
        </BarisForm>

        <BarisForm label="Unit kerja" htmlFor="unitId">
          <select
            id="unitId"
            name="unitId"
            defaultValue=""
            className="h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200"
          >
            <option value="">-- belum ditentukan --</option>
            {unit.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama}
              </option>
            ))}
          </select>
        </BarisForm>

        <BarisForm
          label="Tag"
          htmlFor="tags"
          galat={hasil?.field?.tags}
          petunjuk="Kata kunci dipisah koma, mis. pangkat, 2026, ASN."
        >
          <Input id="tags" name="tags" maxLength={500} placeholder="pangkat, 2026, ASN" />
        </BarisForm>
      </div>

      <BarisForm label="Deskripsi" htmlFor="deskripsi" galat={hasil?.field?.deskripsi}>
        <Textarea id="deskripsi" name="deskripsi" rows={3} maxLength={2000} />
      </BarisForm>

      <BarisForm
        label="Berkas"
        wajib
        htmlFor="berkas"
        galat={hasil?.field?.berkas}
        petunjuk="PDF, DOCX, XLSX, JPG, atau PNG. Maksimal 25 MB."
      >
        <label
          htmlFor="berkas"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-navy-300 bg-navy-50 px-4 py-3 text-sm hover:border-navy-500"
        >
          <FileUp className="h-5 w-5 text-navy-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{namaBerkas || "Pilih berkas..."}</span>
          <Input
            id="berkas"
            name="berkas"
            type="file"
            accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
            required
            className="hidden"
            onChange={(e) => setNamaBerkas(e.target.files?.[0]?.name ?? "")}
          />
        </label>
      </BarisForm>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan />
      </div>
    </form>
  );
}
