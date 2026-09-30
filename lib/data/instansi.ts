import { asc } from "drizzle-orm";
import { cache } from "react";

import { db, schema } from "@/lib/db";

/**
 * Pembacaan pengaturan instansi. `cache` memastikan satu permintaan HTTP hanya
 * melakukan satu kueri meskipun fungsi dipanggil berkali-kali.
 */
export const bacaPengaturan = cache(async (): Promise<Record<string, string>> => {
  const baris = await db.select().from(schema.pengaturan);
  return Object.fromEntries(baris.map((b) => [b.kunci, b.nilai ?? ""]));
});

export interface IdentitasInstansi {
  namaBadan: string;
  namaSingkat: string;
  pemerintah: string;
  alamat: string;
  emailKantor: string;
  telepon: string;
  ukuranKertas: string;
  zonaWaktu: string;
  namaAplikasi: string;
  /** Tautan sosial media (isi lengkap; kosong = tidak ditampilkan). */
  sosmedWhatsapp: string;
  sosmedFacebook: string;
  sosmedInstagram: string;
  sosmedX: string;
  sosmedYoutube: string;
  /* Teks beranda yang dapat diedit admin (kosong = pakai bawaan). */
  berandaJudul: string;
  berandaSubjudul: string;
  berandaSambutanJudul: string;
  berandaSambutanIsi: string;
  berandaSambutanNama: string;
  berandaSambutanJabatan: string;
  berandaSambutanFoto: string;
}

const BAWAAN: IdentitasInstansi = {
  namaBadan: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo",
  namaSingkat: "BKPSDM Kabupaten Yahukimo",
  pemerintah: "Pemerintah Kabupaten Yahukimo",
  alamat: "Komp. Gedung Serba Guna Jl. Kurima - Dekai",
  emailKantor: "bkpsdm@yahukimokab.go.id",
  telepon: "",
  ukuranKertas: "F4 (21,6 x 33 cm)",
  zonaWaktu: "Asia/Jayapura",
  namaAplikasi: "BKPSDM Yahukimo",
  sosmedWhatsapp: "",
  sosmedFacebook: "",
  sosmedInstagram: "",
  sosmedX: "",
  sosmedYoutube: "",
  berandaJudul: "Satu pintu informasi Kepegawaian Kabupaten Yahukimo.",
  berandaSubjudul:
    "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo hadir dengan layanan informasi, berita kegiatan, dan agenda kepegawaian yang cepat, transparan, dan mudah diakses.",
  berandaSambutanJudul: "Melayani ASN, membangun SDM Yahukimo yang unggul",
  berandaSambutanIsi:
    "Selamat datang di portal resmi Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo. Portal ini kami hadirkan sebagai wujud komitmen terhadap keterbukaan informasi dan peningkatan kualitas pelayanan kepegawaian.\n\nKami mengajak seluruh ASN di lingkungan Pemerintah Kabupaten Yahukimo untuk terus meningkatkan kompetensi, integritas, dan semangat pelayanan demi kesejahteraan masyarakat.",
  berandaSambutanNama: "",
  berandaSambutanJabatan: "",
  berandaSambutanFoto: "",
};

export async function identitasInstansi(): Promise<IdentitasInstansi> {
  const p = await bacaPengaturan();
  return {
    namaBadan: p.namaBadan || BAWAAN.namaBadan,
    namaSingkat: p.namaSingkat || BAWAAN.namaSingkat,
    pemerintah: p.pemerintah || BAWAAN.pemerintah,
    alamat: p.alamat || BAWAAN.alamat,
    emailKantor: p.emailKantor || BAWAAN.emailKantor,
    telepon: p.telepon || BAWAAN.telepon,
    ukuranKertas: p.ukuranKertas || BAWAAN.ukuranKertas,
    zonaWaktu: p.zonaWaktu || BAWAAN.zonaWaktu,
    namaAplikasi: p.namaAplikasi || BAWAAN.namaAplikasi,
    sosmedWhatsapp: p.sosmedWhatsapp || BAWAAN.sosmedWhatsapp,
    sosmedFacebook: p.sosmedFacebook || BAWAAN.sosmedFacebook,
    sosmedInstagram: p.sosmedInstagram || BAWAAN.sosmedInstagram,
    sosmedX: p.sosmedX || BAWAAN.sosmedX,
    sosmedYoutube: p.sosmedYoutube || BAWAAN.sosmedYoutube,
    berandaJudul: p.berandaJudul || BAWAAN.berandaJudul,
    berandaSubjudul: p.berandaSubjudul || BAWAAN.berandaSubjudul,
    berandaSambutanJudul: p.berandaSambutanJudul || BAWAAN.berandaSambutanJudul,
    berandaSambutanIsi: p.berandaSambutanIsi || BAWAAN.berandaSambutanIsi,
    berandaSambutanNama: p.berandaSambutanNama || BAWAAN.berandaSambutanNama,
    berandaSambutanJabatan: p.berandaSambutanJabatan || BAWAAN.berandaSambutanJabatan,
    berandaSambutanFoto: p.berandaSambutanFoto || BAWAAN.berandaSambutanFoto,
  };
}

/** Semua unit kerja, terurut sesuai urutan pada STRUKTUR.docx. */
export const daftarUnitKerja = cache(async () => {
  return db.select().from(schema.unitKerja).orderBy(asc(schema.unitKerja.urutan));
});

/** Mencari nama unit kerja berdasarkan id. */
export function namaUnit(id: string | null | undefined, daftar: { id: string; nama: string }[]) {
  if (!id) return null;
  return daftar.find((u) => u.id === id)?.nama ?? null;
}
