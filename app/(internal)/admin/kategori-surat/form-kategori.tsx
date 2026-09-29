"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatKategori, ubahKategori } from "./aksi";

interface DataAwal {
  id: string;
  nama: string;
  kode: string;
  uraian: string;
  aktif: boolean;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Tambah kategori"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir kategori surat untuk CRUD admin. */
export function FormKategori({ dataAwal }: { dataAwal?: DataAwal }) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahKategori : buatKategori,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}
      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Nama kategori" wajib htmlFor={`nama-${kunci}`} galat={hasil?.field?.nama}>
          <Input id={`nama-${kunci}`} name="nama" required maxLength={120} defaultValue={dataAwal?.nama} />
        </BarisForm>
        <BarisForm label="Kode" wajib htmlFor={`kode-${kunci}`} galat={hasil?.field?.kode} petunjuk="Muncul pada nomor surat keluar, mis. KP.">
          <Input id={`kode-${kunci}`} name="kode" required maxLength={10} defaultValue={dataAwal?.kode} />
        </BarisForm>
      </div>

      <BarisForm label="Uraian" htmlFor={`uraian-${kunci}`} galat={hasil?.field?.uraian}>
        <Textarea id={`uraian-${kunci}`} name="uraian" rows={2} maxLength={500} defaultValue={dataAwal?.uraian} />
      </BarisForm>

      <label className="flex items-center gap-2 text-sm text-navy-800">
        <input
          type="checkbox"
          name="aktif"
          defaultChecked={dataAwal ? dataAwal.aktif : true}
          className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
        />
        Kategori aktif
      </label>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
