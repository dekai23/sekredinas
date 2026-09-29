"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_KATEGORI_PENGUMUMAN, LABEL_PRIORITAS } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatPengumuman, ubahPengumuman } from "./aksi";

interface DataAwal {
  id: string;
  judul: string;
  ringkasan: string;
  isi: string;
  prioritas: string;
  kategori: string;
  internal: boolean;
  publik: boolean;
  tanggalMulai: string;
  tanggalBerakhir: string;
}

interface Props {
  dataAwal?: DataAwal;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Terbitkan pengumuman"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir pengumuman internal/publik (PRD 6.H). */
export function FormPengumuman({ dataAwal }: Props) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahPengumuman : buatPengumuman,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}

      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <BarisForm label="Judul" wajib htmlFor={`judul-${kunci}`} galat={hasil?.field?.judul}>
        <Input
          id={`judul-${kunci}`}
          name="judul"
          required
          maxLength={200}
          defaultValue={dataAwal?.judul}
          placeholder="mis. Pemutakhiran Data Kepegawaian Triwulan IV"
        />
      </BarisForm>

      <BarisForm
        label="Ringkasan"
        htmlFor={`ringkasan-${kunci}`}
        galat={hasil?.field?.ringkasan}
        petunjuk="Tampil pada daftar dan kartu di portal publik."
      >
        <Textarea
          id={`ringkasan-${kunci}`}
          name="ringkasan"
          rows={2}
          maxLength={500}
          defaultValue={dataAwal?.ringkasan}
        />
      </BarisForm>

      <BarisForm label="Isi lengkap" wajib htmlFor={`isi-${kunci}`} galat={hasil?.field?.isi}>
        <Textarea id={`isi-${kunci}`} name="isi" required rows={6} maxLength={20000} defaultValue={dataAwal?.isi} />
      </BarisForm>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Kategori" htmlFor={`kategori-${kunci}`}>
          <Select id={`kategori-${kunci}`} name="kategori" defaultValue={dataAwal?.kategori ?? "pengumuman"}>
            {Object.entries(LABEL_KATEGORI_PENGUMUMAN).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Prioritas" htmlFor={`prioritas-${kunci}`}>
          <Select id={`prioritas-${kunci}`} name="prioritas" defaultValue={dataAwal?.prioritas ?? "biasa"}>
            {Object.entries(LABEL_PRIORITAS).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Mulai tayang" htmlFor={`mulai-${kunci}`} galat={hasil?.field?.tanggalMulai}>
          <Input id={`mulai-${kunci}`} name="tanggalMulai" type="date" defaultValue={dataAwal?.tanggalMulai} />
        </BarisForm>
        <BarisForm
          label="Berakhir"
          htmlFor={`berakhir-${kunci}`}
          galat={hasil?.field?.tanggalBerakhir}
          petunjuk="Kosongkan bila berlaku sampai dicabut."
        >
          <Input id={`berakhir-${kunci}`} name="tanggalBerakhir" type="date" defaultValue={dataAwal?.tanggalBerakhir} />
        </BarisForm>
      </div>

      <div className="flex flex-wrap gap-5 rounded-lg border border-navy-100 bg-navy-50 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input
            type="checkbox"
            name="internal"
            defaultChecked={dataAwal ? dataAwal.internal : true}
            className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
          />
          Tampil di aplikasi internal
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input
            type="checkbox"
            name="publik"
            defaultChecked={dataAwal?.publik}
            className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
          />
          Tayangkan di portal publik (/pengumuman)
        </label>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
