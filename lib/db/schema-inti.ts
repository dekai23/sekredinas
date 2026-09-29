/**
 * Skema inti: enum, unit kerja, pegawai (sekaligus akun login), kategori surat,
 * pengaturan instansi, dan penghitung nomor otomatis.
 *
 * Penyesuaian dari PRD.txt Bab 10:
 * - `bidang`   -> `unitKerja` berjenjang (induk_id) sesuai STRUKTUR.docx
 * - `profiles` -> `pegawai` (data kepegawaian + akun dalam satu tabel)
 * - seluruh waktu memakai withTimezone (zona kerja: WIT / Asia/Jayapura)
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  foreignKey,
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

/* ------------------------------- ENUM ------------------------------- */

export const roleEnum = pgEnum("role", ["admin", "pimpinan", "pegawai"]);

export const jenisUnitEnum = pgEnum("jenis_unit", [
  "badan",
  "sekretariat",
  "sub_bagian",
  "bidang",
  "sub_bidang",
  "kelompok_jabatan_fungsional",
  "pemerintah",
]);

/** Peran jabatan - dasar hak disposisi/persetujuan (lihat lib/auth/hak-akses.ts). */
export const peranEnum = pgEnum("peran", [
  "kepala_badan",
  "sekretaris",
  "kepala_bidang",
  "kepala_sub_bagian",
  "kepala_sub_bidang",
  "plt_kepala_sub_bidang",
  "plt_kepala_sub_bagian",
  "fungsional",
  "pelaksana",
]);

export const statusSuratEnum = pgEnum("status_surat", [
  "draft",
  "diajukan",
  "terkirim",
  "dibaca",
  "didisposisi",
  "selesai",
  "arsip",
]);

export const prioritasEnum = pgEnum("prioritas", [
  "biasa",
  "penting",
  "segera",
  "rahasia",
]);

export const statusDisposisiEnum = pgEnum("status_disposisi", [
  "menunggu",
  "diproses",
  "selesai",
]);

export const statusCutiEnum = pgEnum("status_cuti", [
  "menunggu",
  "disetujui",
  "ditolak",
]);

export const kondisiAsetEnum = pgEnum("kondisi_aset", [
  "baik",
  "rusak_ringan",
  "rusak_berat",
]);

/* ---------------------------- UNIT KERJA ---------------------------- */

export const unitKerja = pgTable(
  "unit_kerja",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nama: varchar("nama", { length: 200 }).notNull(),
    /** Kode singkat utk nomor surat & laporan: BKD, SEK, SEK-UK, MPP, PPI-01 */
    kode: varchar("kode", { length: 20 }).notNull(),
    jenis: jenisUnitEnum("jenis").notNull().default("sub_bidang"),
    indukId: uuid("induk_id"),
    urutan: integer("urutan").notNull().default(0),
    /** Eselon jabatan pimpinan unit: II.b / III.a / III.b / IV.a / IV.b */
    pejabatEselon: varchar("pejabat_eselon", { length: 10 }),
    /**
     * true = unit ini berada langsung di bawah "Pemerintah Kabupaten
     * Yahukimo" (bukan sebuah unit kerja, melainkan induk tertinggi).
     * Dipakai untuk unit setingkat Badan yang tidak memiliki unit induk.
     */
    indukPemkab: boolean("induk_pemkab").notNull().default(false),
    publik: boolean("publik").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("unit_kerja_kode_key").on(t.kode),
    index("unit_kerja_induk_idx").on(t.indukId),
    foreignKey({
      name: "unit_kerja_induk_fk",
      columns: [t.indukId],
      foreignColumns: [t.id],
    }).onDelete("set null"),
  ],
);

/* ------------------ PEGAWAI: data kepegawaian + akun ----------------- */

export const pegawai = pgTable(
  "pegawai",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nip: varchar("nip", { length: 30 }),
    namaLengkap: varchar("nama_lengkap", { length: 150 }).notNull(),
    pangkat: varchar("pangkat", { length: 80 }),
    golongan: varchar("golongan", { length: 20 }),
    /** Tampilan "PENATA TK.I (III/d)" untuk laporan & blok tanda tangan. */
    pangkatGolongan: varchar("pangkat_golongan", { length: 120 }),
    jenisJabatan: varchar("jenis_jabatan", { length: 40 }),
    /** Jabatan penuh dari data Excel, mis. "Plt. Kepala Sub Bidang ... pada
     *  Bidang ..." - panjangnya sampai 209 karakter, karena itu 300. */
    jabatan: varchar("jabatan", { length: 300 }),
    eselon: varchar("eselon", { length: 20 }),
    statusPegawai: varchar("status_pegawai", { length: 30 }).notNull().default("PNS"),
    peran: peranEnum("peran").notNull().default("pelaksana"),
    unitId: uuid("unit_id").references(() => unitKerja.id, { onDelete: "set null" }),

    /* akun login */
    email: varchar("email", { length: 150 }).notNull(),
    passwordHash: text("password_hash"),
    role: roleEnum("role").notNull().default("pegawai"),
    wajibGantiPassword: boolean("wajib_ganti_password").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    aktif: boolean("aktif").notNull().default(true),

    telepon: varchar("telepon", { length: 20 }),
    avatarUrl: text("avatar_url"),
    sisaCuti: integer("sisa_cuti").notNull().default(12),
    /** Tahun perhitungan kuota cuti (dinormalisasi tiap awal tahun, Fase 4). */
    tahunCuti: integer("tahun_cuti"),
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("pegawai_nip_key").on(t.nip),
    uniqueIndex("pegawai_email_key").on(t.email),
    index("pegawai_unit_idx").on(t.unitId),
    index("pegawai_role_idx").on(t.role),
    index("pegawai_peran_idx").on(t.peran),
  ],
);

/* --------------------------- KATEGORI SURAT -------------------------- */

export const kategoriSurat = pgTable(
  "kategori_surat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nama: varchar("nama", { length: 120 }).notNull(),
    /** Kode kategori pada nomor surat: SG, TS, UP, KU, dst. */
    kode: varchar("kode", { length: 10 }).notNull(),
    uraian: text("uraian"),
    aktif: boolean("aktif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("kategori_surat_kode_key").on(t.kode)],
);

/* ------------------------- PENGATURAN INSTANSI ----------------------- */

export const pengaturan = pgTable("pengaturan", {
  kunci: varchar("kunci", { length: 80 }).primaryKey(),
  nilai: text("nilai"),
  keterangan: text("keterangan"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------- NOMOR URUT OTOMATIS ----------------------- */

/**
 * Konteks contoh: `SM/2026`, `SK/2026/MPP/09`, `INV/ALAT`.
 * Pengambilan nomor memakai satu pernyataan upsert (atomik):
 *   insert ... on conflict (konteks) do update set nilai = nomor_urut.nilai + 1
 *   returning nilai
 */
export const nomorUrut = pgTable("nomor_urut", {
  konteks: varchar("konteks", { length: 80 }).primaryKey(),
  nilai: integer("nilai").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------ RELATIONS ---------------------------- */

export const unitKerjaRelations = relations(unitKerja, ({ one, many }) => ({
  induk: one(unitKerja, {
    fields: [unitKerja.indukId],
    references: [unitKerja.id],
    relationName: "jenjangUnit",
  }),
  anak: many(unitKerja, { relationName: "jenjangUnit" }),
  pegawai: many(pegawai),
}));

export const pegawaiRelations = relations(pegawai, ({ one }) => ({
  unit: one(unitKerja, { fields: [pegawai.unitId], references: [unitKerja.id] }),
}));

export type UnitKerja = typeof unitKerja.$inferSelect;
export type Pegawai = typeof pegawai.$inferSelect;
export type KategoriSurat = typeof kategoriSurat.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Peran = (typeof peranEnum.enumValues)[number];
