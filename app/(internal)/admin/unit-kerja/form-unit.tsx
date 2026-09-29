"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_JENIS_UNIT } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatUnitKerja, ubahUnitKerja } from "./aksi";

interface DataAwal {
  id: string;
  nama: string;
  kode: string;
  jenis: string;
  indukId: string;
  indukPemkab: boolean;
  urutan: string;
  pejabatEselon: string;
  publik: boolean;
}

interface Props {
  unit: Array<{ id: string; nama: string; kode: string }>;
  dataAwal?: DataAwal;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Tambah unit"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir unit kerja untuk CRUD admin. */
export function FormUnitKerja({ unit, dataAwal }: Props) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahUnitKerja : buatUnitKerja,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}
      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Nama unit" wajib htmlFor={`nama-${kunci}`} galat={hasil?.field?.nama}>
          <Input id={`nama-${kunci}`} name="nama" required maxLength={200} defaultValue={dataAwal?.nama} />
        </BarisForm>
        <BarisForm label="Kode" wajib htmlFor={`kode-${kunci}`} galat={hasil?.field?.kode} petunjuk="Dipakai pada nomor surat, mis. SEK-UK.">
          <Input id={`kode-${kunci}`} name="kode" required maxLength={20} defaultValue={dataAwal?.kode} />
        </BarisForm>
        <BarisForm label="Jenis unit" htmlFor={`jenis-${kunci}`}>
          <Select id={`jenis-${kunci}`} name="jenis" defaultValue={dataAwal?.jenis ?? "sub_bidang"}>
            {Object.entries(LABEL_JENIS_UNIT).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm
          label="Unit induk"
          htmlFor={`induk-${kunci}`}
          petunjuk="Pilih 'Pemerintah Kabupaten Yahukimo' untuk unit setingkat Badan."
        >
          <Select
            id={`induk-${kunci}`}
            name="indukId"
            defaultValue={dataAwal?.indukPemkab ? "__pemkab__" : dataAwal?.indukId ?? ""}
          >
            <option value="">-- tanpa induk (unit teratas) --</option>
            <option value="__pemkab__">Pemerintah Kabupaten Yahukimo</option>
            {unit
              .filter((u) => u.id !== dataAwal?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama} ({u.kode})
                </option>
              ))}
          </Select>
        </BarisForm>
        <BarisForm label="Urutan" htmlFor={`urutan-${kunci}`} galat={hasil?.field?.urutan}>
          <Input id={`urutan-${kunci}`} name="urutan" type="number" min={0} defaultValue={dataAwal?.urutan} />
        </BarisForm>
        <BarisForm label="Eselon" htmlFor={`eselon-${kunci}`} petunjuk="mis. II.b, III.a, IV.a.">
          <Input id={`eselon-${kunci}`} name="pejabatEselon" maxLength={10} defaultValue={dataAwal?.pejabatEselon} />
        </BarisForm>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-800">
        <input
          type="checkbox"
          name="publik"
          defaultChecked={dataAwal ? dataAwal.publik : true}
          className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
        />
        Tampilkan pada halaman profil publik
      </label>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
