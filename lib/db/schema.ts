/**
 * Titik masuk skema untuk drizzle-kit dan seluruh aplikasi.
 * Skema dipecah 3 berkas agar mudah dinavigasi:
 *  - schema-inti.ts    : enum, unit kerja, pegawai, kategori, pengaturan, nomor urut
 *  - schema-surat.ts   : surat masuk/keluar, disposisi, arsip
 *  - schema-konten.ts  : agenda, pengumuman, cuti, inventaris, notifikasi,
 *                        audit log, berita & layanan (portal publik)
 */
export * from "./schema-inti";
export * from "./schema-surat";
export * from "./schema-konten";
