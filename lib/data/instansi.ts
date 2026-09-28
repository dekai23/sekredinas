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
  namaAplikasi: "SekreDinas",
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
