"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatLayanan, ubahLayanan } from "./aksi";

interface DataAwal {
  id: string;
  judul: string;
  slug: string;
  ringkasan: string;
  deskripsi: string;
  syarat: string;
  alur: string;
  waktuPenyelesaian: string;
  dasarHukum: string;
  unitId: string;
  urutan: string;
  publik: boolean;
}

interface Props {
  unit: Array<{ id: string; nama: string }>;
  dataAwal?: DataAwal;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Simpan layanan"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir layanan kepegawaian publik (admin). */
export function FormLayanan({ unit, dataAwal }: Props) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahLayanan : buatLayanan,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}
      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Judul layanan" wajib htmlFor={`judul-${kunci}`} galat={hasil?.field?.judul}>
          <Input id={`judul-${kunci}`} name="judul" required maxLength={200} defaultValue={dataAwal?.judul} placeholder="mis. Kenaikan Pangkat" />
        </BarisForm>
        <BarisForm label="Perkiraan waktu" htmlFor={`waktu-${kunci}`} galat={hasil?.field?.waktuPenyelesaian}>
          <Input id={`waktu-${kunci}`} name="waktuPenyelesaian" maxLength={60} defaultValue={dataAwal?.waktuPenyelesaian} placeholder="mis. 14 hari kerja" />
        </BarisForm>
        <BarisForm label="Slug URL" htmlFor={`slug-${kunci}`} galat={hasil?.field?.slug} petunjuk="Kosongkan untuk otomatis dari judul.">
          <Input id={`slug-${kunci}`} name="slug" maxLength={220} defaultValue={dataAwal?.slug} />
        </BarisForm>
        <BarisForm label="Unit pengelola" htmlFor={`unit-${kunci}`}>
          <Select id={`unit-${kunci}`} name="unitId" defaultValue={dataAwal?.unitId ?? ""}>
            <option value="">-- belum ditentukan --</option>
            {unit.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Dasar hukum" htmlFor={`hukum-${kunci}`} galat={hasil?.field?.dasarHukum}>
          <Input id={`hukum-${kunci}`} name="dasarHukum" maxLength={300} defaultValue={dataAwal?.dasarHukum} placeholder="mis. PermenpanRB No. 3/2020" />
        </BarisForm>
        <BarisForm label="Urutan tampil" htmlFor={`urutan-${kunci}`} galat={hasil?.field?.urutan} petunjuk="Angka kecil tampil lebih dulu.">
          <Input id={`urutan-${kunci}`} name="urutan" type="number" min={0} defaultValue={dataAwal?.urutan ?? "0"} />
        </BarisForm>
      </div>

      <BarisForm label="Ringkasan" htmlFor={`ringkasan-${kunci}`} galat={hasil?.field?.ringkasan}>
        <Textarea id={`ringkasan-${kunci}`} name="ringkasan" rows={2} maxLength={500} defaultValue={dataAwal?.ringkasan} />
      </BarisForm>

      <BarisForm label="Deskripsi" wajib htmlFor={`deskripsi-${kunci}`} galat={hasil?.field?.deskripsi}>
        <Textarea id={`deskripsi-${kunci}`} name="deskripsi" required rows={4} maxLength={20000} defaultValue={dataAwal?.deskripsi} />
      </BarisForm>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm
          label="Syarat berkas"
          htmlFor={`syarat-${kunci}`}
          galat={hasil?.field?.syarat}
          petunjuk="Satu syarat per baris."
        >
          <Textarea id={`syarat-${kunci}`} name="syarat" rows={5} maxLength={8000} defaultValue={dataAwal?.syarat} placeholder={"SK pangkat terakhir\nSurat keputusan jabatan terakhir\n..."} />
        </BarisForm>
        <BarisForm
          label="Alur pengajuan"
          htmlFor={`alur-${kunci}`}
          galat={hasil?.field?.alur}
          petunjuk="Satu langkah per baris."
        >
          <Textarea id={`alur-${kunci}`} name="alur" rows={5} maxLength={8000} defaultValue={dataAwal?.alur} placeholder={"Pegawai menyerahkan berkas\nVerifikasi oleh unit kepegawaian\n..."} />
        </BarisForm>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-800">
        <input type="checkbox" name="publik" defaultChecked={dataAwal ? dataAwal.publik : true} className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500" />
        Tayangkan di portal publik (/layanan)
      </label>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
