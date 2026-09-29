"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_STATUS_ABSENSI } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { catatAbsensi, ubahAbsensi } from "./aksi";

interface DataAwal {
  id: string;
  pegawaiId: string;
  tanggal: string;
  status: string;
  jamMasuk: string;
  jamPulang: string;
  keterangan: string;
}

interface Props {
  pegawai: Array<{ id: string; nama: string; nip: string | null; unit: string | null }>;
  dataAwal?: DataAwal;
  hariIni: string;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Simpan absensi"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir catatan absensi (tambah / ubah). */
export function FormAbsensi({ pegawai, dataAwal, hariIni }: Props) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahAbsensi : catatAbsensi,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}
      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Pegawai" wajib htmlFor={`pegawai-${kunci}`} galat={hasil?.field?.pegawaiId}>
          <Select id={`pegawai-${kunci}`} name="pegawaiId" required defaultValue={dataAwal?.pegawaiId ?? ""}>
            <option value="">-- pilih pegawai --</option>
            {pegawai.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
                {p.nip ? ` (${p.nip})` : ""}
              </option>
            ))}
          </Select>
        </BarisForm>

        <BarisForm label="Tanggal" wajib htmlFor={`tanggal-${kunci}`} galat={hasil?.field?.tanggal}>
          <Input id={`tanggal-${kunci}`} name="tanggal" type="date" required defaultValue={dataAwal?.tanggal ?? hariIni} />
        </BarisForm>

        <BarisForm label="Status kehadiran" htmlFor={`status-${kunci}`}>
          <Select id={`status-${kunci}`} name="status" defaultValue={dataAwal?.status ?? "hadir"}>
            {Object.entries(LABEL_STATUS_ABSENSI).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>
        </BarisForm>

        <div className="grid grid-cols-2 gap-3">
          <BarisForm label="Jam masuk" htmlFor={`masuk-${kunci}`} galat={hasil?.field?.jamMasuk}>
            <Input id={`masuk-${kunci}`} name="jamMasuk" type="time" defaultValue={dataAwal?.jamMasuk} />
          </BarisForm>
          <BarisForm label="Jam pulang" htmlFor={`pulang-${kunci}`} galat={hasil?.field?.jamPulang}>
            <Input id={`pulang-${kunci}`} name="jamPulang" type="time" defaultValue={dataAwal?.jamPulang} />
          </BarisForm>
        </div>
      </div>

      <BarisForm
        label="Keterangan"
        htmlFor={`keterangan-${kunci}`}
        galat={hasil?.field?.keterangan}
        petunjuk="mis. nomor surat izin, lokasi dinas luar, dsb."
      >
        <Textarea id={`keterangan-${kunci}`} name="keterangan" rows={2} maxLength={500} defaultValue={dataAwal?.keterangan} />
      </BarisForm>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
