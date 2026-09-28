import type { LucideIcon } from "lucide-react";

import { adalahPimpinan, type Izin } from "@/lib/auth/hak-akses";
import type { SesiPengguna } from "@/lib/auth/sesi";

/** Nama ikon yang dipakai pada menu (lihat IKON_MENU di sidebar.tsx). */
export type NamaIkon =
  | "layout-dashboard"
  | "inbox"
  | "file-output"
  | "clipboard-list"
  | "archive"
  | "calendar-days"
  | "megaphone"
  | "package"
  | "file-text"
  | "gauge"
  | "users"
  | "settings";

/** Kumpulan ikon yang boleh dipakai; dipakai untuk narrowing di modul klien. */
export type DaftarIkon = Record<string, LucideIcon>;

/**
 * Susunan menu sidebar aplikasi internal (PRD Bab 3.B dan 3.C).
 *
 * `ikon` disimpan sebagai NAMA (string), bukan komponen. Alasannya: sidebar
 * adalah client component, sedangkan menu dibangun di server. Menyerahkan
 * referensi komponen lintas batas server-klien akan ditolak Next.js
 * ("Functions cannot be passed to Client Components"). Komponen ikon
 * dipetakan di sisi klien melalui `IKON_MENU`.
 */
export interface ItemMenu {
  label: string;
  href: string;
  ikon: NamaIkon;
  izin?: Izin;
}

export interface GrupMenu {
  judul: string;
  item: ItemMenu[];
}

/** Susunan menu sidebar aplikasi internal (PRD Bab 3.B dan 3.C). */
export const GRUP_MENU: GrupMenu[] = [
  {
    judul: "Utama",
    item: [{ label: "Dashboard", href: "/dashboard", ikon: "layout-dashboard" }],
  },
  {
    judul: "Persuratan",
    item: [
      { label: "Surat Masuk", href: "/dashboard/surat-masuk", ikon: "inbox", izin: "surat-masuk.lihat" },
      {
        label: "Surat Keluar",
        href: "/dashboard/surat-keluar",
        ikon: "file-output",
        izin: "surat-keluar.lihat",
      },
      {
        label: "Disposisi",
        href: "/dashboard/disposisi",
        ikon: "clipboard-list",
        izin: "disposisi.lihat",
      },
      { label: "Arsip Digital", href: "/dashboard/arsip", ikon: "archive", izin: "arsip.lihat" },
    ],
  },
  {
    judul: "Kepegawaian",
    item: [
      { label: "Agenda", href: "/dashboard/agenda", ikon: "calendar-days", izin: "agenda.lihat" },
      {
        label: "Pengumuman",
        href: "/dashboard/pengumuman",
        ikon: "megaphone",
        izin: "pengumuman.lihat",
      },
      {
        label: "Inventaris",
        href: "/dashboard/inventaris",
        ikon: "package",
        izin: "inventaris.lihat",
      },
    ],
  },
  {
    judul: "Persetujuan",
    item: [
      {
        label: "Persetujuan Surat",
        href: "/dashboard/persetujuan/surat",
        ikon: "file-text",
        izin: "surat-keluar.setujui",
      },
      {
        label: "Persetujuan Cuti",
        href: "/dashboard/persetujuan/cuti",
        ikon: "clipboard-list",
        izin: "cuti.kelola",
      },
    ],
  },
  {
    judul: "Administrasi",
    item: [
      { label: "Laporan", href: "/dashboard/laporan", ikon: "gauge", izin: "laporan.lihat" },
      { label: "Pengguna", href: "/admin/pengguna", ikon: "users", izin: "pengguna.kelola" },
      {
        label: "Unit Kerja",
        href: "/admin/unit-kerja",
        ikon: "settings",
        izin: "unit-kelola",
      },
      {
        label: "Kategori Surat",
        href: "/admin/kategori-surat",
        ikon: "file-text",
        izin: "kategori.kelola",
      },
      {
        label: "Pengaturan",
        href: "/admin/pengaturan",
        ikon: "settings",
        izin: "pengaturan.kelola",
      },
    ],
  },
];

/** Izin yang hanya boleh diakses role admin. */
const IZIN_KHUSUS_ADMIN: Izin[] = [
  "pengguna.kelola",
  "unit-kelola",
  "kategori.kelola",
  "pengaturan.kelola",
  "audit.lihat",
  "arsip.kelola",
  "inventaris.kelola",
  "pengumuman.kelola",
];

/** Izin yang boleh dibuka oleh role pimpinan (dan admin). */
const IZIN_PIMPINAN: Izin[] = [
  "surat-masuk.lihat",
  "surat-masuk.buat",
  "surat-masuk.ubah",
  "surat-keluar.lihat",
  "surat-keluar.buat",
  "surat-keluar.ubah",
  "surat-keluar.setujui",
  "disposisi.lihat",
  "disposisi.buat",
  "disposisi.selesaikan",
  "arsip.lihat",
  "agenda.lihat",
  "agenda.kelola",
  "pengumuman.lihat",
  "cuti.buat",
  "cuti.kelola",
  "inventaris.lihat",
  "laporan.lihat",
  "laporan.rekap",
];

/** Izin dasar pegawai. */
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

/** Admin mewarisi seluruh izin pimpinan, ditambah modul administrasi. */
const IZIN_ADMIN: Izin[] = [...IZIN_PIMPINAN, ...IZIN_KHUSUS_ADMIN];

/** Menyaring menu sidebar sesuai kewenangan sesi. */
export function menuUntukSesi(sesi: SesiPengguna): GrupMenu[] {
  const admin = sesi.role === "admin";
  const pimpinan =
    !admin && (sesi.role === "pimpinan" || adalahPimpinan(sesi.peran));
  const daftarIzin = admin ? IZIN_ADMIN : pimpinan ? IZIN_PIMPINAN : IZIN_PEGAWAI;

  return GRUP_MENU.map((grup) => ({
    judul: grup.judul,
    item: grup.item.filter((item) => !item.izin || daftarIzin.includes(item.izin)),
  })).filter((grup) => grup.item.length > 0);
}
