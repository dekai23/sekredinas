"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/konten";

import { simpanPengaturan } from "./aksi";

export interface NilaiPengaturan {
  namaBadan: string;
  namaSingkat: string;
  pemerintah: string;
  alamat: string;
  emailKantor: string;
  telepon: string;
  ukuranKertas: string;
  zonaWaktu: string;
  namaAplikasi: string;
  sosmedWhatsapp: string;
  sosmedFacebook: string;
  sosmedInstagram: string;
  sosmedX: string;
  sosmedYoutube: string;
  berandaJudul: string;
  berandaSubjudul: string;
  berandaSambutanJudul: string;
  berandaSambutanIsi: string;
  berandaSambutanNama: string;
  berandaSambutanJabatan: string;
  berandaSambutanFoto: string;
}

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : (
        <>
          <Save className="h-4 w-4" aria-hidden />
          Simpan pengaturan
        </>
      )}
    </Tombol>
  );
}

/** Formulir identitas instansi & preferensi sistem (admin). */
export function FormPengaturan({ nilai }: { nilai: NilaiPengaturan }) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(simpanPengaturan, null);

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {hasil?.galat ? <Pesan nada="galat" judul="Gagal menyimpan">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Nama badan (lengkap)" wajib htmlFor="namaBadan" galat={hasil?.field?.namaBadan}>
          <Input id="namaBadan" name="namaBadan" required maxLength={200} defaultValue={nilai.namaBadan} />
        </BarisForm>
        <BarisForm label="Nama singkat" wajib htmlFor="namaSingkat" galat={hasil?.field?.namaSingkat}>
          <Input id="namaSingkat" name="namaSingkat" required maxLength={150} defaultValue={nilai.namaSingkat} />
        </BarisForm>
        <BarisForm label="Pemerintah daerah" wajib htmlFor="pemerintah" galat={hasil?.field?.pemerintah}>
          <Input id="pemerintah" name="pemerintah" required maxLength={150} defaultValue={nilai.pemerintah} />
        </BarisForm>
        <BarisForm label="Alamat kantor" wajib htmlFor="alamat" galat={hasil?.field?.alamat}>
          <Input id="alamat" name="alamat" required maxLength={200} defaultValue={nilai.alamat} />
        </BarisForm>
        <BarisForm label="Email kantor" wajib htmlFor="emailKantor" galat={hasil?.field?.emailKantor}>
          <Input id="emailKantor" name="emailKantor" type="email" required maxLength={150} defaultValue={nilai.emailKantor} />
        </BarisForm>
        <BarisForm label="Telepon" htmlFor="telepon">
          <Input id="telepon" name="telepon" maxLength={30} defaultValue={nilai.telepon} />
        </BarisForm>
        <BarisForm label="Ukuran kertas" htmlFor="ukuranKertas" petunjuk="Dipakai pada kop surat.">
          <Input id="ukuranKertas" name="ukuranKertas" maxLength={50} defaultValue={nilai.ukuranKertas} />
        </BarisForm>
        <BarisForm label="Zona waktu" htmlFor="zonaWaktu">
          <Input id="zonaWaktu" name="zonaWaktu" maxLength={50} defaultValue={nilai.zonaWaktu} />
        </BarisForm>
        <BarisForm label="Nama aplikasi" htmlFor="namaAplikasi">
          <Input id="namaAplikasi" name="namaAplikasi" maxLength={80} defaultValue={nilai.namaAplikasi} />
        </BarisForm>
      </div>

      <div className="rounded-lg border border-navy-100 bg-navy-50/60 p-4">
        <p className="text-sm font-bold text-navy-800">Media Sosial</p>
        <p className="mb-3 text-xs text-navy-500">
          Isi tautan lengkap (mis. https://instagram.com/...). Kosongkan bila belum ada —
          ikon akan otomatis disembunyikan di footer.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <BarisForm label="WhatsApp" htmlFor="sosmedWhatsapp" galat={hasil?.field?.sosmedWhatsapp}>
            <Input id="sosmedWhatsapp" name="sosmedWhatsapp" maxLength={300} defaultValue={nilai.sosmedWhatsapp} placeholder="https://wa.me/62812..." />
          </BarisForm>
          <BarisForm label="Facebook" htmlFor="sosmedFacebook" galat={hasil?.field?.sosmedFacebook}>
            <Input id="sosmedFacebook" name="sosmedFacebook" maxLength={300} defaultValue={nilai.sosmedFacebook} placeholder="https://facebook.com/..." />
          </BarisForm>
          <BarisForm label="Instagram" htmlFor="sosmedInstagram" galat={hasil?.field?.sosmedInstagram}>
            <Input id="sosmedInstagram" name="sosmedInstagram" maxLength={300} defaultValue={nilai.sosmedInstagram} placeholder="https://instagram.com/..." />
          </BarisForm>
          <BarisForm label="X (Twitter)" htmlFor="sosmedX" galat={hasil?.field?.sosmedX}>
            <Input id="sosmedX" name="sosmedX" maxLength={300} defaultValue={nilai.sosmedX} placeholder="https://x.com/..." />
          </BarisForm>
          <BarisForm label="YouTube" htmlFor="sosmedYoutube" galat={hasil?.field?.sosmedYoutube}>
            <Input id="sosmedYoutube" name="sosmedYoutube" maxLength={300} defaultValue={nilai.sosmedYoutube} placeholder="https://youtube.com/@..." />
          </BarisForm>
        </div>
      </div>

      <div className="rounded-lg border border-navy-100 bg-navy-50/60 p-4">
        <p className="text-sm font-bold text-navy-800">Teks Beranda</p>
        <p className="mb-3 text-xs text-navy-500">
          Mengubah judul hero, subjudul, dan sambutan Kepala Badan di halaman beranda.
        </p>
        <div className="space-y-4">
          <BarisForm label="Judul hero" htmlFor="berandaJudul" galat={hasil?.field?.berandaJudul} petunjuk="Kata 'Yahukimo' otomatis diberi warna emas.">
            <Input id="berandaJudul" name="berandaJudul" maxLength={200} defaultValue={nilai.berandaJudul} />
          </BarisForm>
          <BarisForm label="Subjudul hero" htmlFor="berandaSubjudul" galat={hasil?.field?.berandaSubjudul}>
            <Textarea id="berandaSubjudul" name="berandaSubjudul" rows={2} maxLength={600} defaultValue={nilai.berandaSubjudul} />
          </BarisForm>
          <BarisForm label="Judul sambutan" htmlFor="berandaSambutanJudul" galat={hasil?.field?.berandaSambutanJudul}>
            <Input id="berandaSambutanJudul" name="berandaSambutanJudul" maxLength={200} defaultValue={nilai.berandaSambutanJudul} />
          </BarisForm>
          <BarisForm
            label="Isi sambutan"
            htmlFor="berandaSambutanIsi"
            galat={hasil?.field?.berandaSambutanIsi}
            petunjuk="Pisahkan antar paragraf dengan baris kosong."
          >
            <Textarea id="berandaSambutanIsi" name="berandaSambutanIsi" rows={6} maxLength={6000} defaultValue={nilai.berandaSambutanIsi} />
          </BarisForm>
          <div className="grid gap-4 sm:grid-cols-2">
            <BarisForm label="Nama pejabat" htmlFor="berandaSambutanNama" galat={hasil?.field?.berandaSambutanNama} petunjuk="Kosongkan untuk otomatis dari data Kepala Badan.">
              <Input id="berandaSambutanNama" name="berandaSambutanNama" maxLength={150} defaultValue={nilai.berandaSambutanNama} />
            </BarisForm>
            <BarisForm label="Jabatan pejabat" htmlFor="berandaSambutanJabatan" galat={hasil?.field?.berandaSambutanJabatan}>
              <Input id="berandaSambutanJabatan" name="berandaSambutanJabatan" maxLength={200} defaultValue={nilai.berandaSambutanJabatan} />
            </BarisForm>
          </div>
          <BarisForm label="URL foto pejabat" htmlFor="berandaSambutanFoto" galat={hasil?.field?.berandaSambutanFoto} petunjuk="Opsional. Kosongkan untuk memakai ilustrasi bawaan.">
            <Input id="berandaSambutanFoto" name="berandaSambutanFoto" maxLength={500} defaultValue={nilai.berandaSambutanFoto} placeholder="https://..." />
          </BarisForm>
        </div>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <TombolSimpan />
      </div>
    </form>
  );
}
