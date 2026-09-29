import { Building2, Info } from "lucide-react";

import { Kartu, KartuIsi, KartuKepala, Pesan } from "@/components/ui/dasar";
import { wajibRole } from "@/lib/auth/hak-akses";
import { identitasInstansi } from "@/lib/data/instansi";

import { FormPengaturan } from "./form-pengaturan";

export const dynamic = "force-dynamic";

/** Pengaturan identitas instansi & preferensi sistem (admin). */
export default async function HalamanPengaturan() {
  await wajibRole(["admin"], "admin/pengaturan");
  const instansi = await identitasInstansi();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Pengaturan Sistem</h1>
        <p className="text-sm text-navy-500">
          Identitas instansi dipakai pada kop surat, portal publik, dan dokumen resmi.
        </p>
      </div>

      <Pesan nada="info" judul="Catatan">
        Perubahan berlaku pada kop surat dan seluruh halaman publik setelah disimpan.
      </Pesan>

      <Kartu>
        <KartuKepala
          judul="Identitas instansi"
          aksi={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500">
              <Building2 className="h-3.5 w-3.5" aria-hidden /> Kop & portal
            </span>
          }
        />
        <KartuIsi>
          <FormPengaturan
            nilai={{
              namaBadan: instansi.namaBadan,
              namaSingkat: instansi.namaSingkat,
              pemerintah: instansi.pemerintah,
              alamat: instansi.alamat,
              emailKantor: instansi.emailKantor,
              telepon: instansi.telepon,
              ukuranKertas: instansi.ukuranKertas,
              zonaWaktu: instansi.zonaWaktu,
              namaAplikasi: instansi.namaAplikasi,
              sosmedWhatsapp: instansi.sosmedWhatsapp,
              sosmedFacebook: instansi.sosmedFacebook,
              sosmedInstagram: instansi.sosmedInstagram,
              sosmedX: instansi.sosmedX,
              sosmedYoutube: instansi.sosmedYoutube,
              berandaJudul: instansi.berandaJudul,
              berandaSubjudul: instansi.berandaSubjudul,
              berandaSambutanJudul: instansi.berandaSambutanJudul,
              berandaSambutanIsi: instansi.berandaSambutanIsi,
              berandaSambutanNama: instansi.berandaSambutanNama,
              berandaSambutanJabatan: instansi.berandaSambutanJabatan,
              berandaSambutanFoto: instansi.berandaSambutanFoto,
            }}
          />
        </KartuIsi>
      </Kartu>

      <Kartu>
        <KartuKepala judul="Format penomoran surat" deskripsi="Nilai tetap sesuai konfigurasi sistem." />
        <KartuIsi className="space-y-2 text-sm text-navy-700">
          <p className="flex items-center gap-2">
            <Info className="h-4 w-4 text-navy-400" aria-hidden />
            Nomor agenda surat masuk: <span className="font-mono">SM-{"{TAHUN}"}-{"{URUT}"}</span>
          </p>
          <p className="flex items-center gap-2">
            <Info className="h-4 w-4 text-navy-400" aria-hidden />
            Nomor surat keluar:{" "}
            <span className="font-mono">{"{KODE}"}/{"{URUT}"}/{"{UNIT}"}/{"{ROMAWI}"}/{"{TAHUN}"}</span>
          </p>
          <p className="flex items-center gap-2">
            <Info className="h-4 w-4 text-navy-400" aria-hidden />
            Kode aset: <span className="font-mono">INV-{"{KATEGORI}"}-{"{URUT}"}</span>
          </p>
        </KartuIsi>
      </Kartu>
    </div>
  );
}
