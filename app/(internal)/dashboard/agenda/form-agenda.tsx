"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_JENIS_AGENDA } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatAgenda, ubahAgenda } from "./aksi";

interface DataAwal {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  mulai: string;
  selesai: string;
  jenis: string;
  publik: boolean;
  penanggungJawabId: string;
}

interface Props {
  pegawai: Array<{ id: string; nama: string }>;
  dataAwal?: DataAwal;
}

function TombolSimpan({ mode }: { mode: "buat" | "ubah" }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending} ukuran={mode === "ubah" ? "kecil" : "sedang"}>
      {pending ? (
        "Menyimpan..."
      ) : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Simpan agenda"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir agenda untuk menambah atau mengubah (PRD 6.F). */
export function FormAgenda({ pegawai, dataAwal }: Props) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahAgenda : buatAgenda,
    null,
  );

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}

      {hasil?.galat ? (
        <Pesan nada="galat" judul="Gagal menyimpan">
          {hasil.galat}
        </Pesan>
      ) : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <BarisForm label="Judul kegiatan" wajib htmlFor={`judul-${dataAwal?.id ?? "baru"}`} galat={hasil?.field?.judul}>
        <Input
          id={`judul-${dataAwal?.id ?? "baru"}`}
          name="judul"
          required
          maxLength={200}
          defaultValue={dataAwal?.judul}
          placeholder="mis. Rapat Koordinasi Bulanan"
        />
      </BarisForm>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Waktu mulai" wajib htmlFor={`mulai-${dataAwal?.id ?? "baru"}`} galat={hasil?.field?.mulai}>
          <Input
            id={`mulai-${dataAwal?.id ?? "baru"}`}
            name="mulai"
            type="datetime-local"
            required
            defaultValue={dataAwal?.mulai}
          />
        </BarisForm>
        <BarisForm
          label="Waktu selesai"
          htmlFor={`selesai-${dataAwal?.id ?? "baru"}`}
          galat={hasil?.field?.selesai}
          petunjuk="Opsional. Harus setelah waktu mulai."
        >
          <Input
            id={`selesai-${dataAwal?.id ?? "baru"}`}
            name="selesai"
            type="datetime-local"
            defaultValue={dataAwal?.selesai}
          />
        </BarisForm>
        <BarisForm label="Jenis" htmlFor={`jenis-${dataAwal?.id ?? "baru"}`}>
          <Select id={`jenis-${dataAwal?.id ?? "baru"}`} name="jenis" defaultValue={dataAwal?.jenis ?? "rapat"}>
            {Object.entries(LABEL_JENIS_AGENDA).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Lokasi" htmlFor={`lokasi-${dataAwal?.id ?? "baru"}`} galat={hasil?.field?.lokasi}>
          <Input
            id={`lokasi-${dataAwal?.id ?? "baru"}`}
            name="lokasi"
            maxLength={200}
            defaultValue={dataAwal?.lokasi}
            placeholder="mis. Ruang Rapat Utama"
          />
        </BarisForm>
      </div>

      <BarisForm label="Deskripsi" htmlFor={`deskripsi-${dataAwal?.id ?? "baru"}`} galat={hasil?.field?.deskripsi}>
        <Textarea
          id={`deskripsi-${dataAwal?.id ?? "baru"}`}
          name="deskripsi"
          rows={3}
          maxLength={2000}
          defaultValue={dataAwal?.deskripsi}
        />
      </BarisForm>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Penanggung jawab" htmlFor={`pj-${dataAwal?.id ?? "baru"}`}>
          <Select id={`pj-${dataAwal?.id ?? "baru"}`} name="penanggungJawabId" defaultValue={dataAwal?.penanggungJawabId ?? ""}>
            <option value="">-- belum ditentukan --</option>
            {pegawai.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </BarisForm>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-navy-800">
          <input
            type="checkbox"
            name="publik"
            defaultChecked={dataAwal?.publik}
            className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
          />
          Tayangkan di portal publik
        </label>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
