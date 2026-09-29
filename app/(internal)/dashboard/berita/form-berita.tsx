"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_KATEGORI_BERITA } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatBerita, ubahBerita } from "./aksi";

interface DataAwal {
  id: string;
  judul: string;
  slug: string;
  ringkasan: string;
  isi: string;
  kategori: string;
  gambarUrl: string;
  publik: boolean;
  noindex: boolean;
  tanggalTerbit: string;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Terbitkan"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir berita/artikel/kegiatan. */
export function FormBerita({ dataAwal }: { dataAwal?: DataAwal }) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahBerita : buatBerita,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}
      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <BarisForm label="Judul" wajib htmlFor={`judul-${kunci}`} galat={hasil?.field?.judul}>
        <Input id={`judul-${kunci}`} name="judul" required maxLength={200} defaultValue={dataAwal?.judul} placeholder="mis. Bimtek Penyusunan SKP bagi Pejabat Fungsional" />
      </BarisForm>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Kategori" htmlFor={`kategori-${kunci}`}>
          <Select id={`kategori-${kunci}`} name="kategori" defaultValue={dataAwal?.kategori ?? "kegiatan"}>
            {Object.entries(LABEL_KATEGORI_BERITA).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Tanggal terbit" htmlFor={`terbit-${kunci}`} galat={hasil?.field?.tanggalTerbit}>
          <Input id={`terbit-${kunci}`} name="tanggalTerbit" type="date" defaultValue={dataAwal?.tanggalTerbit} />
        </BarisForm>
      </div>

      <BarisForm
        label="Slug URL"
        htmlFor={`slug-${kunci}`}
        galat={hasil?.field?.slug}
        petunjuk="Kosongkan untuk dibuat otomatis dari judul."
      >
        <Input id={`slug-${kunci}`} name="slug" maxLength={220} defaultValue={dataAwal?.slug} placeholder="bimtek-penyusunan-skp" />
      </BarisForm>

      <BarisForm label="Ringkasan" htmlFor={`ringkasan-${kunci}`} galat={hasil?.field?.ringkasan}>
        <Textarea id={`ringkasan-${kunci}`} name="ringkasan" rows={2} maxLength={500} defaultValue={dataAwal?.ringkasan} />
      </BarisForm>

      <BarisForm label="Isi lengkap" wajib htmlFor={`isi-${kunci}`} galat={hasil?.field?.isi} petunjuk="Pisahkan antar paragraf dengan baris kosong.">
        <Textarea id={`isi-${kunci}`} name="isi" required rows={10} maxLength={40000} defaultValue={dataAwal?.isi} />
      </BarisForm>

      <BarisForm
        label="URL gambar utama"
        htmlFor={`gambar-${kunci}`}
        galat={hasil?.field?.gambarUrl}
        petunjuk="Opsional. Kosongkan untuk memakai sampul otomatis sesuai kategori."
      >
        <Input id={`gambar-${kunci}`} name="gambarUrl" maxLength={500} defaultValue={dataAwal?.gambarUrl} placeholder="https://..." />
      </BarisForm>

      <div className="flex flex-wrap gap-5 rounded-lg border border-navy-100 bg-navy-50 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input type="checkbox" name="publik" defaultChecked={dataAwal ? dataAwal.publik : true} className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500" />
          Tayangkan di portal publik
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input type="checkbox" name="noindex" defaultChecked={dataAwal?.noindex} className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500" />
          Sembunyikan dari mesin pencari (noindex)
        </label>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
