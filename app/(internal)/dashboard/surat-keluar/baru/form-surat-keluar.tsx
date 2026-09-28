"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import Link from "next/link";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/surat";

import { buatSuratKeluar } from "../aksi";

const SIFAT = [
  { nilai: "biasa", label: "Biasa" },
  { nilai: "penting", label: "Penting" },
  { nilai: "segera", label: "Segera" },
  { nilai: "rahasia", label: "Rahasia" },
];

interface Props {
  kategori: Array<{ id: string; nama: string; kode: string }>;
  unit: Array<{ id: string; nama: string; kode: string }>;
  penandatangan: Array<{ id: string; nama: string; jabatan: string }>;
  hariIni: string;
}

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      {pending ? (
        "Menyimpan..."
      ) : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          Simpan draf
        </>
      )}
    </Tombol>
  );
}

/** Formulir penyusun surat keluar (PRD 6.C). */
export function FormSuratKeluar({ kategori, unit, penandatangan, hariIni }: Props) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(buatSuratKeluar, null);

  return (
    <form action={kirim} className="space-y-5" noValidate>
      {hasil?.galat ? (
        <Pesan nada="galat" judul="Penyimpanan gagal">
          {hasil.galat}
        </Pesan>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <BarisForm label="Tujuan surat" wajib htmlFor="tujuan" galat={hasil?.field?.tujuan}>
          <Input id="tujuan" name="tujuan" required maxLength={200} placeholder="mis. Kepala Bagian Kepegawaian" />
        </BarisForm>

        <BarisForm label="Tanggal surat" wajib htmlFor="tanggalSurat">
          <Input id="tanggalSurat" name="tanggalSurat" type="date" required defaultValue={hariIni} />
        </BarisForm>

        <BarisForm label="Kategori surat" wajib htmlFor="kategoriId" galat={hasil?.field?.kategoriId}>
          <Select id="kategoriId" name="kategoriId" required defaultValue="">
            <option value="">-- pilih kategori --</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} ({k.kode})
              </option>
            ))}
          </Select>
        </BarisForm>

        <BarisForm
          label="Unit penerbit"
          wajib
          htmlFor="unitId"
          galat={hasil?.field?.unitId}
          petunjuk="Kode unit ini akan muncul pada nomor surat."
        >
          <Select id="unitId" name="unitId" required defaultValue="">
            <option value="">-- pilih unit --</option>
            {unit.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama} ({u.kode})
              </option>
            ))}
          </Select>
        </BarisForm>

        <BarisForm
          label="Penandatangan"
          wajib
          htmlFor="penandatanganId"
          galat={hasil?.field?.penandatanganId}
          petunjuk="Hanya pegawai berjabatan pimpinan yang dapat menandatangani."
        >
          <Select id="penandatanganId" name="penandatanganId" required defaultValue="">
            <option value="">-- pilih pejabat --</option>
            {penandatangan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} - {p.jabatan}
              </option>
            ))}
          </Select>
        </BarisForm>

        <BarisForm label="Sifat surat" htmlFor="sifat">
          <Select id="sifat" name="sifat" defaultValue="biasa">
            {SIFAT.map((s) => (
              <option key={s.nilai} value={s.nilai}>
                {s.label}
              </option>
            ))}
          </Select>
        </BarisForm>
      </div>

      <BarisForm label="Perihal" wajib htmlFor="perihal" galat={hasil?.field?.perihal}>
        <Input id="perihal" name="perihal" required maxLength={2000} />
      </BarisForm>

      <BarisForm
        label="Isi surat"
        wajib
        htmlFor="isiSurat"
        galat={hasil?.field?.isiSurat}
        petunjuk="Naskah yang akan dicetak pada kop surat F4."
      >
        <Textarea id="isiSurat" name="isiSurat" required rows={10} maxLength={20000} />
      </BarisForm>

      <BarisForm
        label="Paraf untuk"
        htmlFor="parafUntuk"
        petunjuk="Opsional. Boleh diisi lebih dari satu nama dipisahkan koma, bila perlu paraf Routing."
      >
        <Input id="parafUntuk" name="parafUntuk" maxLength={500} />
      </BarisForm>

      <BarisForm
        label="Lampiran"
        htmlFor="lampiran"
        galat={hasil?.field?.lampiran}
        petunjuk="Opsional. PDF atau DOCX, maksimal 10 MB."
      >
        <Input id="lampiran" name="lampiran" type="file" accept=".pdf,.docx,.doc" />
      </BarisForm>

      <div className="flex flex-wrap gap-2 border-t border-navy-100 pt-4">
        <TombolSimpan />
        <Link href="/dashboard/surat-keluar">
          <Tombol type="button" varian="garis">
            Batal
          </Tombol>
        </Link>
      </div>
    </form>
  );
}

