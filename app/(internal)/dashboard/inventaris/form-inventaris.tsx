"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_KONDISI_ASET } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { buatInventaris, ubahInventaris } from "./aksi";

interface DataAwal {
  id: string;
  namaAset: string;
  kategori: string;
  merek: string;
  tahunPerolehan: string;
  jumlah: string;
  satuan: string;
  kondisi: string;
  lokasi: string;
  nilaiPerolehan: string;
  nomorPolisi: string;
  nomorBmn: string;
  sumberDana: string;
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
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          {mode === "ubah" ? "Simpan perubahan" : "Simpan aset"}
        </>
      )}
    </Tombol>
  );
}

/** Formulir inventaris aset (PRD 6.I). */
export function FormInventaris({ pegawai, dataAwal }: Props) {
  const mode = dataAwal ? "ubah" : "buat";
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    mode === "ubah" ? ubahInventaris : buatInventaris,
    null,
  );
  const kunci = dataAwal?.id ?? "baru";

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {dataAwal ? <input type="hidden" name="id" value={dataAwal.id} /> : null}

      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Nama aset" wajib htmlFor={`nama-${kunci}`} galat={hasil?.field?.namaAset}>
          <Input id={`nama-${kunci}`} name="namaAset" required maxLength={200} defaultValue={dataAwal?.namaAset} placeholder="mis. Laptop Lenovo ThinkPad E14" />
        </BarisForm>
        <BarisForm label="Kategori" wajib htmlFor={`kategori-${kunci}`} galat={hasil?.field?.kategori}>
          <Input id={`kategori-${kunci}`} name="kategori" required maxLength={100} defaultValue={dataAwal?.kategori} placeholder="mis. Elektronik" />
        </BarisForm>
        <BarisForm label="Merek" htmlFor={`merek-${kunci}`}>
          <Input id={`merek-${kunci}`} name="merek" maxLength={100} defaultValue={dataAwal?.merek} />
        </BarisForm>
        <BarisForm label="Tahun perolehan" htmlFor={`tahun-${kunci}`} galat={hasil?.field?.tahunPerolehan}>
          <Input id={`tahun-${kunci}`} name="tahunPerolehan" type="number" min={1900} max={2200} defaultValue={dataAwal?.tahunPerolehan} />
        </BarisForm>
        <BarisForm label="Jumlah" htmlFor={`jumlah-${kunci}`} galat={hasil?.field?.jumlah}>
          <Input id={`jumlah-${kunci}`} name="jumlah" type="number" min={1} defaultValue={dataAwal?.jumlah ?? "1"} />
        </BarisForm>
        <BarisForm label="Satuan" htmlFor={`satuan-${kunci}`}>
          <Input id={`satuan-${kunci}`} name="satuan" maxLength={20} defaultValue={dataAwal?.satuan ?? "unit"} />
        </BarisForm>
        <BarisForm label="Kondisi" htmlFor={`kondisi-${kunci}`}>
          <Select id={`kondisi-${kunci}`} name="kondisi" defaultValue={dataAwal?.kondisi ?? "baik"}>
            {Object.entries(LABEL_KONDISI_ASET).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Lokasi" htmlFor={`lokasi-${kunci}`}>
          <Input id={`lokasi-${kunci}`} name="lokasi" maxLength={200} defaultValue={dataAwal?.lokasi} />
        </BarisForm>
        <BarisForm label="Nilai perolehan (Rp)" htmlFor={`nilai-${kunci}`} galat={hasil?.field?.nilaiPerolehan}>
          <Input id={`nilai-${kunci}`} name="nilaiPerolehan" inputMode="numeric" defaultValue={dataAwal?.nilaiPerolehan} placeholder="12500000" />
        </BarisForm>
        <BarisForm label="Nomor polisi" htmlFor={`polisi-${kunci}`} petunjuk="Untuk kendaraan.">
          <Input id={`polisi-${kunci}`} name="nomorPolisi" maxLength={30} defaultValue={dataAwal?.nomorPolisi} />
        </BarisForm>
        <BarisForm label="Nomor BMN" htmlFor={`bmn-${kunci}`}>
          <Input id={`bmn-${kunci}`} name="nomorBmn" maxLength={30} defaultValue={dataAwal?.nomorBmn} />
        </BarisForm>
        <BarisForm label="Sumber dana" htmlFor={`dana-${kunci}`}>
          <Input id={`dana-${kunci}`} name="sumberDana" maxLength={100} defaultValue={dataAwal?.sumberDana} placeholder="mis. APBD / DAK" />
        </BarisForm>
        <BarisForm label="Penanggung jawab" htmlFor={`pj-${kunci}`}>
          <Select id={`pj-${kunci}`} name="penanggungJawabId" defaultValue={dataAwal?.penanggungJawabId ?? ""}>
            <option value="">-- belum ditentukan --</option>
            {pegawai.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </BarisForm>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan mode={mode} />
      </div>
    </form>
  );
}
