import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan kelas Tailwind dengan penyelesaian konflik (shadcn/ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Zonasi waktu kerja: WIT (Kabupaten Yahukimo, Papua Tengah). */
export const ZONA_WAKTU = "Asia/Jayapura";

/** "Senin, 29 September 2026" - format resmi surat dinas. */
export function tanggalPanjang(tanggal: Date | string | null | undefined): string {
  if (!tanggal) return "-";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA_WAKTU,
  }).format(d);
}

/** "29 September 2026" - dipakai pada blok tanda tangan. */
export function tanggalSedang(tanggal: Date | string | null | undefined): string {
  if (!tanggal) return "-";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA_WAKTU,
  }).format(d);
}

/** "29-09-2026 14.05" - format ringkas pada tabel dan daftar. */
export function tanggalRingkas(tanggal: Date | string | null | undefined): string {
  if (!tanggal) return "-";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ZONA_WAKTU,
  }).format(d);
}

const BULAN_ROMAWI = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
] as const;

/** Bulan Romawi untuk nomor surat: tanggal 29 Sep 2026 -> "IX". */
export function bulanRomawi(tanggal: Date = new Date()): string {
  return BULAN_ROMAWI[tanggal.getMonth()];
}

/** Awal & akhir hari (WIT) - untuk filter laporan harian. */
export function rentangHari(tanggal: Date = new Date()): { mulai: Date; selesai: Date } {
  const mulai = new Date(tanggal);
  mulai.setHours(0, 0, 0, 0);
  const selesai = new Date(tanggal);
  selesai.setHours(23, 59, 59, 999);
  return { mulai, selesai };
}

/** Awal & akhir bulan ini - rekap bulanan pada dashboard & laporan. */
export function rentangBulan(tanggal: Date = new Date()): { mulai: Date; selesai: Date } {
  const mulai = new Date(tanggal.getFullYear(), tanggal.getMonth(), 1, 0, 0, 0, 0);
  const selesai = new Date(tanggal.getFullYear(), tanggal.getMonth() + 1, 0, 23, 59, 59, 999);
  return { mulai, selesai };
}

/** Ubah tanggal menjadi format `YYYY-MM-DD` (bentuk kolom `date` di PostgreSQL). */
export function tanggalSql(tanggal: Date): string {
  const d = new Date(tanggal);
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

/** Awal & akhir bulan ini sebagai string SQL (untuk kolom `date`). */
export function rentangBulanSql(tanggal: Date = new Date()): { mulai: string; selesai: string } {
  const tahun = tanggal.getFullYear();
  const bulan = tanggal.getMonth();
  return {
    mulai: tanggalSql(new Date(tahun, bulan, 1)),
    selesai: tanggalSql(new Date(tahun, bulan + 1, 0)),
  };
}

/** Awal & akhir hari ini sebagai string SQL. */
export function rentangHariSql(tanggal: Date = new Date()): { mulai: string; selesai: string } {
  const hari = tanggalSql(tanggal);
  return { mulai: hari, selesai: hari };
}

/** Angka rupiah: 1500000 -> "Rp 1.500.000" (label; nilai tetap integer). */
export function rupiah(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

/**
 * Menambah n hari kerja (Senin-Jumat) pada sebuah tanggal.
 * Dipakai untuk batas waktu disposisi: 2 hari kerja (PRD 6.D).
 */
export function tambahHariKerja(tanggal: Date, jumlah: number): Date {
  const hasil = new Date(tanggal);
  let sisa = jumlah;
  while (sisa > 0) {
    hasil.setDate(hasil.getDate() + 1);
    const hari = hasil.getDay();
    if (hari !== 0 && hari !== 6) sisa -= 1;
  }
  return hasil;
}

/** Jumlah hari kerja antara dua tanggal, inklusif. */
export function hitungHariKerja(mulai: Date, selesai: Date): number {
  if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) return 0;
  let total = 0;
  const salinan = new Date(mulai);
  salinan.setHours(12, 0, 0, 0);
  const akhir = new Date(selesai);
  akhir.setHours(12, 0, 0, 0);
  while (salinan.getTime() <= akhir.getTime()) {
    const hari = salinan.getDay();
    if (hari !== 0 && hari !== 6) total += 1;
    salinan.setDate(salinan.getDate() + 1);
  }
  return total;
}

/**
 * Mengubah waktu lokal WIT (format `<input type="datetime-local">`, mis.
 * `2026-09-29T14:30`) menjadi `Date` yang benar. WIT selalu UTC+9 tanpa
 * penyesuaian musim, sehingga offset cukup ditambahkan tetap.
 */
export function waktuWit(lokal: string): Date {
  const bersih = lokal.trim();
  const denganDetik = /T\d{2}:\d{2}$/.test(bersih) ? `${bersih}:00` : bersih;
  return new Date(`${denganDetik}+09:00`);
}

/** Awal hari (00:00 WIT) dari tanggal `YYYY-MM-DD`. */
export function tanggalWit(tanggal: string): Date {
  return new Date(`${tanggal.trim()}T00:00:00+09:00`);
}

/**
 * Format `Date` menjadi waktu lokal WIT `YYYY-MM-DDTHH:mm` - nilai yang
 * diterima `<input type="datetime-local">`.
 */
export function formatWaktuLokal(tanggal: Date | string): string {
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  if (Number.isNaN(d.getTime())) return "";
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_WAKTU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const p = Object.fromEntries(bagian.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Nama berkas aman untuk disimpan di folder unggahan. */
export function namaBerkasAman(namaAsli: string): string {
  const dasar = namaAsli
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return dasar.length > 0 ? dasar.slice(0, 120) : "berkas";
}

/**
 * Membuat slug URL dari judul: "Bimtek Penyusunan SKP 2026" ->
 * "bimtek-penyusunan-skp-2026". Dipakai untuk berita dan konten publik.
 */
export function buatSlug(judul: string): string {
  return judul
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180)
    .replace(/^-|-$/g, "");
}

/** Inisial untuk avatar: "Theodorus Valentinus, S.Kom." -> "TV". */
export function inisial(nama: string): string {
  return nama
    .replace(/[^A-Za-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k.charAt(0).toUpperCase())
    .join("");
}
