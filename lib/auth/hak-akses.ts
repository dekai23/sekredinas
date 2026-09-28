/**
 * Kontrol akses berbasis peran (RBAC) - saduran PRD.txt Bab 5.
 *
 * Tiga lapis pemeriksaan:
 *  1. `boleh()`          - cek izin untuk tindakan tertentu.
 *  2. `wajibMasuk()`      - memaksa login, mengembalikan sesi pengguna.
 *  3. `wajibRole([...])`  - membatasi halaman pada role tertentu.
 *
 * `peran` berasal dari jabatan (pimpinan unit), `role` dari hak sistem
 * (admin / pimpinan / pegawai). Keduanya dipakai karena keduanya berbeda:
 * seorang kepala bidang tetap "pegawai" dari sisi sistem, tetapi berwenang
 * menerima disposisi karena jabatannya.
 */
import { redirect } from "next/navigation";

import { sesiSaatIni, type SesiPengguna } from "./sesi";

export type Izin =
  /* modul persuratan */
  | "surat-masuk.lihat"
  | "surat-masuk.buat"
  | "surat-masuk.ubah"
  | "surat-keluar.lihat"
  | "surat-keluar.buat"
  | "surat-keluar.ubah"
  | "surat-keluar.setujui"
  | "disposisi.lihat"
  | "disposisi.buat"
  | "disposisi.selesaikan"
  | "arsip.lihat"
  | "arsip.kelola"
  /* kepegawaian & aset */
  | "agenda.lihat"
  | "agenda.kelola"
  | "pengumuman.lihat"
  | "pengumuman.kelola"
  | "cuti.buat"
  | "cuti.kelola"
  | "inventaris.lihat"
  | "inventaris.kelola"
  /* admin & laporan */
  | "pengguna.kelola"
  | "unit-kelola"
  | "kategori.kelola"
  | "laporan.lihat"
  | "laporan.rekap"
  | "pengaturan.kelola"
  | "audit.lihat";

/** Peran jabatan yang boleh memberi instruksi dan persetujuan. */
export const PERAN_PIMPINAN = [
  "kepala_badan",
  "sekretaris",
  "kepala_bidang",
  "kepala_sub_bagian",
  "kepala_sub_bidang",
  "plt_kepala_sub_bidang",
  "plt_kepala_sub_bagian",
] as const;

export function adalahPimpinan(peran: string): boolean {
  return (PERAN_PIMPINAN as readonly string[]).includes(peran);
}

const IZIN_PEGAWAI: Izin[] = [
  "surat-masuk.lihat",
  "surat-masuk.buat",
  "surat-keluar.lihat",
  "surat-keluar.buat",
  "disposisi.lihat",
  "arsip.lihat",
  "agenda.lihat",
  "agenda.kelola",
  "pengumuman.lihat",
  "cuti.buat",
  "inventaris.lihat",
];

const IZIN_PIMPINAN: Izin[] = [
  ...IZIN_PEGAWAI,
  "surat-masuk.ubah",
  "surat-keluar.ubah",
  "surat-keluar.setujui",
  "disposisi.buat",
  "disposisi.selesaikan",
  "cuti.kelola",
  "laporan.lihat",
  "laporan.rekap",
];

const IZIN_ADMIN: Izin[] = [
  ...IZIN_PIMPINAN,
  "arsip.kelola",
  "pengumuman.kelola",
  "inventaris.kelola",
  "pengguna.kelola",
  "unit-kelola",
  "kategori.kelola",
  "pengaturan.kelola",
  "audit.lihat",
];

export function boleh(sesi: SesiPengguna | null, izin: Izin): boolean {
  if (!sesi || !sesi.role) return false;
  if (sesi.role === "admin") return IZIN_ADMIN.includes(izin);
  if (sesi.role === "pimpinan" || adalahPimpinan(sesi.peran)) {
    return IZIN_PIMPINAN.includes(izin);
  }
  return IZIN_PEGAWAI.includes(izin);
}

/** Memaksa login; mengembalikan sesi bila sudah masuk. */
export async function wajibMasuk(area: string = "dashboard"): Promise<SesiPengguna> {
  const sesi = await sesiSaatIni();
  if (!sesi) {
    redirect(`/masuk?lanjut=/${area}`);
  }
  return sesi;
}

/** Membatasi halaman pada role tertentu (mis. /admin hanya untuk admin). */
export async function wajibRole(
  role: Array<SesiPengguna["role"]>,
  area: string = "dashboard",
): Promise<SesiPengguna> {
  const sesi = await wajibMasuk(area);
  if (!role.includes(sesi.role)) {
    redirect("/dashboard?galat=tidak-diizinkan");
  }
  return sesi;
}
