/**
 * Tabel pendukung operasional & konten: agenda, pengumuman, cuti, inventaris,
 * notifikasi internal, audit log, serta konten portal publik (berita, layanan).
 * Sesuai PRD Bab 6.6-6.10 dan docs/ARSITEKTUR.md.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  kondisiAsetEnum,
  pegawai,
  prioritasEnum,
  statusCutiEnum,
  unitKerja,
} from "./schema-inti";

/* ------------------------------- AGENDA ------------------------------ */

export const agenda = pgTable(
  "agenda",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judul: varchar("judul", { length: 200 }).notNull(),
    deskripsi: text("deskripsi"),
    lokasi: varchar("lokasi", { length: 200 }),
    mulai: timestamp("mulai", { withTimezone: true }).notNull(),
    selesai: timestamp("selesai", { withTimezone: true }),
    /** rapat | kunjungan | pelatihan | kegiatan | lainnya */
    jenis: varchar("jenis", { length: 50 }).notNull().default("rapat"),
    /** true = tampil di portal publik. */
    publik: boolean("publik").notNull().default(false),
    penanggungJawabId: uuid("penanggung_jawab_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by")
      .references(() => pegawai.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("agenda_mulai_idx").on(t.mulai),
    index("agenda_publik_idx").on(t.publik),
  ],
);

/* ----------------------------- PENGUMUMAN ---------------------------- */

export const pengumuman = pgTable(
  "pengumuman",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judul: varchar("judul", { length: 200 }).notNull(),
    /** Ringkasan untuk daftar di halaman publik. */
    ringkasan: text("ringkasan"),
    isi: text("isi").notNull(),
    prioritas: prioritasEnum("prioritas").notNull().default("biasa"),
    /** pengumuman | kegiatan | informasi | layanan | pencwatan */
    kategori: varchar("kategori", { length: 40 }).notNull().default("pengumuman"),
    /** true = hanya untuk pengguna internal (tidak tayang di portal). */
    internal: boolean("internal").notNull().default(true),
    publik: boolean("publik").notNull().default(false),
    lampiranUrl: text("lampiran_url"),
    tanggalMulai: timestamp("tanggal_mulai", { withTimezone: true })
      .defaultNow()
      .notNull(),
    tanggalBerakhir: timestamp("tanggal_berakhir", { withTimezone: true }),
    createdBy: uuid("created_by")
      .references(() => pegawai.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("pengumuman_publik_idx").on(t.publik),
    index("pengumuman_mulai_idx").on(t.tanggalMulai),
  ],
);

/* -------------------------------- CUTI ------------------------------- */

/**
 * Pengajuan cuti (PRD 6.7). Kuota tahunan 12 hari kerja; jumlah hari kerja
 * dihitung server-side dari tanggalMulai..tanggalSelesai (tidak mempercayai
 * nilai totalHari yang dikirim klien).
 */
export const cuti = pgTable(
  "cuti",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pegawaiId: uuid("pegawai_id")
      .references(() => pegawai.id)
      .notNull(),
    /** cuti_annual | cuti_besar | cuti_sakit | cuti_melahirkan | cuti_khusus */
    jenisCuti: varchar("jenis_cuti", { length: 30 }).notNull(),
    tanggalMulai: date("tanggal_mulai").notNull(),
    tanggalSelesai: date("tanggal_selesai").notNull(),
    totalHari: integer("total_hari").notNull(),
    alasan: text("alasan").notNull(),
    alamatTujuan: varchar("alamat_tujuan", { length: 200 }),
    kontak: varchar("kontak", { length: 50 }),
    lampiranUrl: text("lampiran_url"),
    status: statusCutiEnum("status").notNull().default("menunggu"),
    disetujuiOlehId: uuid("disetujui_oleh_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    disetujuiPada: timestamp("disetujui_pada", { withTimezone: true }),
    catatanPersetujuan: text("catatan_persetujuan"),
    /** Sisa kuota salinan saat disetujui (agar riwayat tetap utuh). */
    sisaCutiSetelah: integer("sisa_cuti_setelah"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cuti_pegawai_idx").on(t.pegawaiId),
    index("cuti_status_idx").on(t.status),
    index("cuti_mulai_idx").on(t.tanggalMulai),
  ],
);

/* ------------------------------ INVENTARIS ---------------------------- */

/** Kode aset: `INV-{KATEGORI}-{URUT}`, mis. INV-ALAT-0007 (PRD 6.9). */
export const inventaris = pgTable(
  "inventaris",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kodeAset: varchar("kode_aset", { length: 50 }).notNull(),
    namaAset: varchar("nama_aset", { length: 200 }).notNull(),
    kategori: varchar("kategori", { length: 100 }).notNull(),
    merek: varchar("merek", { length: 100 }),
    tahunPerolehan: integer("tahun_perolehan"),
    jumlah: integer("jumlah").notNull().default(1),
    satuan: varchar("satuan", { length: 20 }).notNull().default("unit"),
    kondisi: kondisiAsetEnum("kondisi").notNull().default("baik"),
    lokasi: varchar("lokasi", { length: 200 }),
    /** Rupiah penuh (integer) agar tidak terkena galat pembulatan float. */
    nilaiPerolehan: integer("nilai_perolehan"),
    nomorPolisi: varchar("nomor_polisi", { length: 30 }),
    nomorBmn: varchar("nomor_bmn", { length: 30 }),
    sumberDana: varchar("sumber_dana", { length: 100 }),
    penanggungJawabId: uuid("penanggung_jawab_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("inventaris_kode_key").on(t.kodeAset),
    index("inventaris_kategori_idx").on(t.kategori),
    index("inventaris_kondisi_idx").on(t.kondisi),
  ],
);

/* ------------------------------ ABSENSI ------------------------------- */

/** Status kehadiran harian ASN. */
export const statusAbsensiEnum = pgEnum("status_absensi", [
  "hadir",
  "izin",
  "sakit",
  "cuti",
  "dinas_luar",
  "alpa",
]);

/**
 * Catatan kehadiran (presensi) ASN harian. Satu pegawai hanya boleh memiliki
 * satu catatan per tanggal (dijaga oleh unique index). Diakses hanya oleh
 * Admin serta Kepala Sub Bagian Umum dan Kepegawaian (lib/auth/hak-akses.ts).
 */
export const absensi = pgTable(
  "absensi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pegawaiId: uuid("pegawai_id")
      .references(() => pegawai.id, { onDelete: "cascade" })
      .notNull(),
    tanggal: date("tanggal").notNull(),
    jamMasuk: timestamp("jam_masuk", { withTimezone: true }),
    jamPulang: timestamp("jam_pulang", { withTimezone: true }),
    status: statusAbsensiEnum("status").notNull().default("hadir"),
    keterangan: text("keterangan"),
    dicatatOlehId: uuid("dicatat_oleh_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("absensi_pegawai_tanggal_key").on(t.pegawaiId, t.tanggal),
    index("absensi_tanggal_idx").on(t.tanggal),
    index("absensi_status_idx").on(t.status),
  ],
);

/* ----------------------------- NOTIFIKASI ---------------------------- */

export const notifikasi = pgTable(
  "notifikasi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => pegawai.id, { onDelete: "cascade" })
      .notNull(),
    judul: varchar("judul", { length: 200 }).notNull(),
    pesan: text("pesan").notNull(),
    /** disposisi | persetujuan_cuti | surat_masuk | pengumuman | sistem */
    tipe: varchar("tipe", { length: 40 }).notNull().default("sistem"),
    link: text("link"),
    dibaca: boolean("dibaca").notNull().default(false),
    dibacaPada: timestamp("dibaca_pada", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notifikasi_user_idx").on(t.userId),
    index("notifikasi_baca_idx").on(t.userId, t.dibaca),
  ],
);

/* ------------------------------ AUDIT LOG ----------------------------- */

/** Catatan audit untuk perubahan penting (PRD 8.2). Jangan pernah dihapus. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => pegawai.id, { onDelete: "set null" }),
    /** create | update | delete | login | logout | unduh | setujui | tolak */
    aksi: varchar("aksi", { length: 40 }).notNull(),
    entitas: varchar("entitas", { length: 40 }).notNull(),
    entitasId: uuid("entitas_id"),
    /** Ringkasan perubahan (JSON atau deskripsi), tanpa data sensitif. */
    perubahan: text("perubahan"),
    ip: varchar("ip", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_log_user_idx").on(t.userId),
    index("audit_log_entitas_idx").on(t.entitas, t.entitasId),
    index("audit_log_waktu_idx").on(t.createdAt),
  ],
);

/* ------------------- KONTEN PORTAL PUBLIK (zona publik) --------------- */

/** Berita/kegiatan instansi. Hanya baris `publik = true` yang boleh tampil. */
export const berita = pgTable(
  "berita",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judul: varchar("judul", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    ringkasan: text("ringkasan"),
    isi: text("isi").notNull(),
    /** Ditampilkan sebagai gambar utama di daftar berita. */
    gambarUrl: text("gambar_url"),
    kategori: varchar("kategori", { length: 50 }).notNull().default("kegiatan"),
    /** Kunci snugt untuk menahan halaman dari mesin pencari bila perlu. */
    noindex: boolean("noindex").notNull().default(false),
    publik: boolean("publik").notNull().default(false),
    tanggalTerbit: timestamp("tanggal_terbit", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => pegawai.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("berita_slug_key").on(t.slug),
    index("berita_publik_idx").on(t.publik, t.tanggalTerbit),
  ],
);

/** Informasi layanan kepegawaian untuk masyarakat (lihat docs/ARSITEKTUR.md). */
export const layanan = pgTable(
  "layanan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judul: varchar("judul", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    ringkasan: text("ringkasan"),
    deskripsi: text("deskripsi").notNull(),
    /** Syarat & dokumen: disimpan sebagai JSON array agar mudah desolateksi. */
    syarat: text("syarat"),
    /** Alur pengajuan: JSON array langkah. */
    alur: text("alur"),
    /** Perkiraan waktu penyelesaian, mis. "14 hari kerja". */
    waktuPenyelesaian: varchar("waktu_penyelesaian", { length: 60 }),
    /** Dasar hukum, mis. "PermenpanRB No. 3/2020". */
    dasarHukum: text("dasar_hukum"),
    /** Unit pengelola layanan. */
    unitId: uuid("unit_id").references(() => unitKerja.id, { onDelete: "set null" }),
    urutan: integer("urutan").notNull().default(0),
    publik: boolean("publik").notNull().default(false),
    createdBy: uuid("created_by").references(() => pegawai.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("layanan_slug_key").on(t.slug),
    index("layanan_publik_idx").on(t.publik, t.urutan),
  ],
);

/* ------------------------------ RELATIONS ---------------------------- */

export const agendaRelations = relations(agenda, ({ one }) => ({
  penanggungJawab: one(pegawai, {
    fields: [agenda.penanggungJawabId],
    references: [pegawai.id],
    relationName: "agendaPenanggungJawab",
  }),
  pembuat: one(pegawai, {
    fields: [agenda.createdBy],
    references: [pegawai.id],
    relationName: "agendaPembuat",
  }),
}));

export const pengumumanRelations = relations(pengumuman, ({ one }) => ({
  pembuat: one(pegawai, {
    fields: [pengumuman.createdBy],
    references: [pegawai.id],
    relationName: "pengumumanPembuat",
  }),
}));

export const cutiRelations = relations(cuti, ({ one }) => ({
  pemohon: one(pegawai, {
    fields: [cuti.pegawaiId],
    references: [pegawai.id],
    relationName: "cutiPemohon",
  }),
  penyetuju: one(pegawai, {
    fields: [cuti.disetujuiOlehId],
    references: [pegawai.id],
    relationName: "cutiPenyetuju",
  }),
}));

export const inventarisRelations = relations(inventaris, ({ one }) => ({
  penanggungJawab: one(pegawai, {
    fields: [inventaris.penanggungJawabId],
    references: [pegawai.id],
    relationName: "inventarisPenanggungJawab",
  }),
}));

export const absensiRelations = relations(absensi, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [absensi.pegawaiId],
    references: [pegawai.id],
    relationName: "absensiPegawai",
  }),
  pencatat: one(pegawai, {
    fields: [absensi.dicatatOlehId],
    references: [pegawai.id],
    relationName: "absensiPencatat",
  }),
}));

export const notifikasiRelations = relations(notifikasi, ({ one }) => ({
  pengguna: one(pegawai, {
    fields: [notifikasi.userId],
    references: [pegawai.id],
    relationName: "notifikasiPengguna",
  }),
}));

export const beritaRelations = relations(berita, ({ one }) => ({
  pembuat: one(pegawai, { fields: [berita.createdBy], references: [pegawai.id] }),
}));

export const layananRelations = relations(layanan, ({ one }) => ({
  unit: one(unitKerja, { fields: [layanan.unitId], references: [unitKerja.id] }),
  pembuat: one(pegawai, { fields: [layanan.createdBy], references: [pegawai.id] }),
}));

export type Agenda = typeof agenda.$inferSelect;
export type Pengumuman = typeof pengumuman.$inferSelect;
export type Cuti = typeof cuti.$inferSelect;
export type Inventaris = typeof inventaris.$inferSelect;
export type Absensi = typeof absensi.$inferSelect;
export type Berita = typeof berita.$inferSelect;
export type Layanan = typeof layanan.$inferSelect;
