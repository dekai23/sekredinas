/**
 * Kamus label & warna untuk enumerasi (dipakai di tabel dan lencana).
 * Dipusatkan agar tampilan konsisten di semua modul.
 */
export type Nada = "netral" | "emas" | "teal" | "sukses" | "perhatian" | "bahaya" | "gelap";

export const LABEL_JENIS_AGENDA: Record<string, { label: string; nada: Nada }> = {
  rapat: { label: "Rapat", nada: "netral" },
  kunjungan: { label: "Kunjungan", nada: "teal" },
  pelatihan: { label: "Pelatihan", nada: "emas" },
  kegiatan: { label: "Kegiatan", nada: "sukses" },
  lainnya: { label: "Lainnya", nada: "netral" },
};

export const LABEL_KATEGORI_PENGUMUMAN: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  informasi: "Informasi",
  layanan: "Layanan",
  pencapaian: "Pencapaian",
};

export const LABEL_KATEGORI_BERITA: Record<string, string> = {
  berita: "Berita",
  kegiatan: "Kegiatan",
  artikel: "Artikel",
  diklat: "Diklat",
  prestasi: "Prestasi",
};

export const LABEL_JENIS_UNIT: Record<string, string> = {
  pemerintah: "Pemerintah Daerah",
  badan: "Badan",
  sekretariat: "Sekretariat",
  sub_bagian: "Sub Bagian",
  bidang: "Bidang",
  sub_bidang: "Sub Bidang",
  kelompok_jabatan_fungsional: "Kelompok Jabatan Fungsional",
};

export const LABEL_PRIORITAS: Record<string, { label: string; nada: Nada }> = {
  biasa: { label: "Biasa", nada: "netral" },
  penting: { label: "Penting", nada: "emas" },
  segera: { label: "Segera", nada: "bahaya" },
  rahasia: { label: "Rahasia", nada: "gelap" },
};

export const LABEL_STATUS_SURAT_MASUK: Record<string, { label: string; nada: Nada }> = {
  terkirim: { label: "Terkirim", nada: "netral" },
  dibaca: { label: "Dibaca", nada: "teal" },
  didisposisi: { label: "Didisposisi", nada: "emas" },
  selesai: { label: "Selesai", nada: "sukses" },
  arsip: { label: "Diarsipkan", nada: "gelap" },
};

export const LABEL_STATUS_SURAT_KELUAR: Record<string, { label: string; nada: Nada }> = {
  draft: { label: "Draf", nada: "netral" },
  diajukan: { label: "Menunggu Persetujuan", nada: "perhatian" },
  terkirim: { label: "Terkirim", nada: "sukses" },
  selesai: { label: "Selesai", nada: "teal" },
  arsip: { label: "Diarsipkan", nada: "gelap" },
};

export const LABEL_STATUS_DISPOSISI: Record<string, { label: string; nada: Nada }> = {
  menunggu: { label: "Menunggu", nada: "perhatian" },
  diproses: { label: "Diproses", nada: "teal" },
  selesai: { label: "Selesai", nada: "sukses" },
};

export const LABEL_SIFAT: Record<string, { label: string; nada: Nada }> = {
  biasa: { label: "Biasa", nada: "netral" },
  penting: { label: "Penting", nada: "emas" },
  segera: { label: "Segera", nada: "bahaya" },
  rahasia: { label: "Rahasia", nada: "gelap" },
};

export const LABEL_JENIS_CUTI: Record<string, string> = {
  cuti_annual: "Cuti Tahunan",
  cuti_besar: "Cuti Besar",
  cuti_sakit: "Cuti Sakit",
  cuti_melahirkan: "Cuti Melahirkan",
  cuti_khusus: "Cuti Khusus",
};

export const LABEL_KONDISI_ASET: Record<string, { label: string; nada: Nada }> = {
  baik: { label: "Baik", nada: "sukses" },
  rusak_ringan: { label: "Rusak Ringan", nada: "perhatian" },
  rusak_berat: { label: "Rusak Berat", nada: "bahaya" },
};

export const LABEL_STATUS_ABSENSI: Record<string, { label: string; nada: Nada }> = {
  hadir: { label: "Hadir", nada: "sukses" },
  izin: { label: "Izin", nada: "teal" },
  sakit: { label: "Sakit", nada: "perhatian" },
  cuti: { label: "Cuti", nada: "emas" },
  dinas_luar: { label: "Dinas Luar", nada: "netral" },
  alpa: { label: "Alpa", nada: "bahaya" },
};

/** Nilai lencana; return `null` bila status tidak dikenal. */
export function nadaStatus(
  kamus: Record<string, { label: string; nada: Nada }>,
  status: string,
): { label: string; nada: Nada } | null {
  return kamus[status] ?? null;
}

/** Format ukuran berkas untuk tampilan. */
export function ukuranBerkas(byte: number | null | undefined): string {
  if (!byte) return "-";
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(0)} KB`;
  return `${(byte / 1024 / 1024).toFixed(1)} MB`;
}
