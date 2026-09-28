"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileUp, Save } from "lucide-react";
import Link from "next/link";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";

import { registrasiSuratMasuk } from "../aksi";
import type { HasilForm } from "@/lib/validasi/surat";

const SIFAT = [
  { nilai: "biasa", label: "Biasa" },
  { nilai: "penting", label: "Penting" },
  { nilai: "segera", label: "Segera" },
  { nilai: "rahasia", label: "Rahasia (hanya Admin & Pimpinan)" },
];

interface Props {
  kategori: Array<{ id: string; nama: string }>;
  hariIni: string;
}

/** Tombol simpan yang menampilkan status sibuk selama server action berjalan. */
function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Menyimpan...
        </>
      ) : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          Simpan &amp; buat nomor agenda
        </>
      )}
    </Tombol>
  );
}

/** Formulir registrasi surat masuk (PRD 6.B). */
export function FormSuratMasuk({ kategori, hariIni }: Props) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(registrasiSuratMasuk, null);
  const [namaBerkas, setNamaBerkas] = useState<string>("");

  return (
    <form action={kirim} className="space-y-5" noValidate>
      {hasil?.galat ? (
        <Pesan nada="galat" judul="Registrasi gagal">
          {hasil.galat}
        </Pesan>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <BarisForm
          label="Asal surat"
          wajib
          htmlFor="asalSurat"
          galat={hasil?.field?.asalSurat}
          petunjuk="Instansi / pihak pengirim surat."
        >
          <Input
            id="asalSurat"
            name="asalSurat"
            required
            maxLength={200}
            placeholder="mis. Pemerintah Provinsi Papua Tengah"
          />
        </BarisForm>

        <BarisForm
          label="Nomor surat pengirim"
          htmlFor="nomorSurat"
          galat={hasil?.field?.nomorSurat}
          petunjuk="Kosongkan bila surat tidak bernomor."
        >
          <Input id="nomorSurat" name="nomorSurat" maxLength={100} placeholder="mis. 800/D/2026" />
        </BarisForm>

        <BarisForm
          label="Tanggal surat"
          wajib
          htmlFor="tanggalSurat"
          galat={hasil?.field?.tanggalSurat}
        >
          <Input
            id="tanggalSurat"
            name="tanggalSurat"
            type="date"
            required
            max={hariIni}
            defaultValue={hariIni}
          />
        </BarisForm>

        <BarisForm
          label="Tanggal diterima"
          wajib
          htmlFor="tanggalTerima"
          galat={hasil?.field?.tanggalTerima}
        >
          <Input
            id="tanggalTerima"
            name="tanggalTerima"
            type="date"
            required
            max={hariIni}
            defaultValue={hariIni}
          />
        </BarisForm>

        <BarisForm label="Kategori surat" htmlFor="kategoriId">
          <Select id="kategoriId" name="kategoriId" defaultValue="">
            <option value="">-- belum ditentukan --</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </Select>
        </BarisForm>

        <BarisForm label="Sifat surat" htmlFor="sifat" galat={hasil?.field?.sifat}>
          <Select id="sifat" name="sifat" defaultValue="biasa">
            {SIFAT.map((s) => (
              <option key={s.nilai} value={s.nilai}>
                {s.label}
              </option>
            ))}
          </Select>
        </BarisForm>
      </div>

      <BarisForm
        label="Perihal"
        wajib
        htmlFor="perihal"
        galat={hasil?.field?.perihal}
        petunjuk="Ringkasan isi surat, maksimal 2000 karakter."
      >
        <Textarea id="perihal" name="perihal" required rows={3} maxLength={2000} />
      </BarisForm>

      <BarisForm
        label="Catatan internally"
        htmlFor="catatan"
        galat={hasil?.field?.catatan}
        petunjuk="Catatan internal kantor. Tidak tampil pada laporan yang dibagikan ke pihak luar."
      >
        <Textarea id="catatan" name="catatan" rows={2} maxLength={1000} />
      </BarisForm>

      <BarisForm
        label="Berkas scan (PDF)"
        wajib
        htmlFor="berkas"
        galat={hasil?.field?.berkas}
        petunjuk="Hanya PDF, maksimal 10 MB. Berkas disimpan di server dan hanya dapat dibuka pengguna yang berwenang."
      >
        <label
          htmlFor="berkas"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-navy-300 bg-navy-50 px-4 py-3 text-sm hover:border-navy-500"
        >
          <FileUp className="h-5 w-5 text-navy-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {namaBerkas || "Pilih berkas PDF..."}
          </span>
          <Input
            id="berkas"
            name="berkas"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="hidden"
            onChange={(e) => setNamaBerkas(e.target.files?.[0]?.name ?? "")}
          />
        </label>
      </BarisForm>

      <div className="flex flex-wrap gap-2 border-t border-navy-100 pt-4">
        <TombolSimpan />
        <Link href="/dashboard/surat-masuk">
          <Tombol type="button" varian="garis">
            Batal
          </Tombol>
        </Link>
      </div>
    </form>
  );
}
