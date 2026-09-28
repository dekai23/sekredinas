/**
 * Tabel persuratan: surat masuk, surat keluar, disposisi berantai, dan arsip.
 * Berdasar PRD.txt Bab 6 & 10, disesuaikan dengan realitas BKPSDM Yahukimo
 * (unit kerja menggantikan `bidang`, pegawai menggantikan `profiles`).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  kategoriSurat,
  pegawai,
  prioritasEnum,
  statusDisposisiEnum,
  statusSuratEnum,
  unitKerja,
} from "./schema-inti";

/* ---------------------------- SURAT MASUK ---------------------------- */

/**
 * Nomor agenda otomatis: `SM-{TAHUN}-{URUT}` (PRD Bab 6.2),mis. SM-2026-0001.
 * `nomorSurat` adalah nomor pada surat aslinya dari pengirim (boleh kosong
 * untuk surat yang memang tidak bernomor, mis. samplel/kop).
 */
export const suratMasuk = pgTable(
  "surat_masuk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorAgenda: varchar("nomor_agenda", { length: 50 }).notNull(),
    nomorSurat: varchar("nomor_surat", { length: 100 }),
    tanggalSurat: date("tanggal_surat").notNull(),
    tanggalTerima: date("tanggal_terima").notNull(),
    /** Surat berhalangan ≤3 hari = "segera", >3 hari & bertanda = "penting" (PRD 6.2). */
    asalSurat: varchar("asal_surat", { length: 200 }).notNull(),
    perihal: text("perihal").notNull(),
    kategoriId: uuid("kategori_id").references(() => kategoriSurat.id, {
      onDelete: "set null",
    }),
    sifat: prioritasEnum("sifat").notNull().default("biasa"),
    fileUrl: text("file_url"),
    fileName: varchar("file_name", { length: 255 }),
    fileSize: integer("file_size"),
    status: statusSuratEnum("status").notNull().default("terkirim"),
    catatan: text("catatan"),
    disposisiOlehId: uuid("disposisi_oleh_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by")
      .references(() => pegawai.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("surat_masuk_agenda_key").on(t.nomorAgenda),
    index("surat_masuk_tanggal_idx").on(t.tanggalTerima),
    index("surat_masuk_status_idx").on(t.status),
    index("surat_masuk_kategori_idx").on(t.kategoriId),
  ],
);


/* ---------------------------- SURAT KELUAR --------------------------- */

/**
 * Nomor surat keluar (PRD Bab 6.3):
 *   {KODE_KATEGORI}/{URUT}/{KODE_UNIT}/{BULAN_ROMAWI}/{TAHUN}
 *   contoh: SG/012/SEK/III/2026
 *
 * Nomor diberikan saat surat diajukan untuk persetujuan. Setelah disetujui,
 * kolom `terkunci` = true: naskah tidak boleh diedit, hanya diarsipkan.
 */
export const suratKeluar = pgTable(
  "surat_keluar",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomorSurat: varchar("nomor_surat", { length: 100 }),
    tanggalSurat: date("tanggal_surat").notNull(),
    unitId: uuid("unit_id").references(() => unitKerja.id, { onDelete: "set null" }),
    tujuan: varchar("tujuan", { length: 200 }).notNull(),
    perihal: text("perihal").notNull(),
    kategoriId: uuid("kategori_id").references(() => kategoriSurat.id, {
      onDelete: "set null",
    }),
    sifat: prioritasEnum("sifat").notNull().default("biasa"),
    /** Naskah surat yang dicetak pada kop F4 (components/kop/kop-surat.tsx). */
    isiSurat: text("isi_surat"),
    /** Jejak paraf, disimpan sebagai JSON: [{ unitId, nama, instruksi }]. */
    parafUntuk: text("paraf_untuk"),
    fileUrl: text("file_url"),
    fileName: varchar("file_name", { length: 255 }),
    fileSize: integer("file_size"),
    status: statusSuratEnum("status").notNull().default("draft"),
    /** true = naskah final, tidak boleh diedit lagi (PRD 6.3). */
    terkunci: boolean("terkunci").notNull().default(false),
    penandatanganId: uuid("penandatangan_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    disetujuiOlehId: uuid("disetujui_oleh_id").references(() => pegawai.id, {
      onDelete: "set null",
    }),
    disetujuiPada: timestamp("disetujui_pada", { withTimezone: true }),
    catatanPersetujuan: text("catatan_persetetujuan"),
    createdBy: uuid("created_by")
      .references(() => pegawai.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("surat_keluar_nomor_key").on(t.nomorSurat),
    index("surat_keluar_tanggal_idx").on(t.tanggalSurat),
    index("surat_keluar_status_idx").on(t.status),
    index("surat_keluar_unit_idx").on(t.unitId),
  ],
);


/* ----------------------------- DISPOSISI ---------------------------- */

/**
 * Disposisi berantai (PRD 6.4): `indukId` menunjuk disposisi asal sehingga
 * riwayat berantai dapat ditelusuri utuh. Batas waktu 2 hari kerja; bila lewat,
 * sistem menampilkan badge "Terlambat" (dihitung saat tampil, tidak disimpan).
 */
export const disposisi = pgTable(
  "disposisi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    suratMasukId: uuid("surat_masuk_id")
      .references(() => suratMasuk.id, { onDelete: "cascade" })
      .notNull(),
    dariUserId: uuid("dari_user_id")
      .references(() => pegawai.id)
      .notNull(),
    keUserId: uuid("ke_user_id")
      .references(() => pegawai.id)
      .notNull(),
    instruksi: text("instruksi").notNull(),
    catatan: text("catatan"),
    /** Kedalaman 1..n untuk facilitate tampilan timeline berantai. */
    level: integer("level").notNull().default(1),
    indukId: uuid("induk_id"),
    batasWaktu: date("batas_waktu"),
    status: statusDisposisiEnum("status").notNull().default("menunggu"),
    dibacaPada: timestamp("dibaca_pada", { withTimezone: true }),
    selesaiPada: timestamp("selesai_pada", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("disposisi_surat_idx").on(t.suratMasukId),
    index("disposisi_ke_idx").on(t.keUserId),
    index("disposisi_status_idx").on(t.status),
    index("disposisi_induk_idx").on(t.indukId),
    foreignKey({
      name: "disposisi_induk_fk",
      columns: [t.indukId],
      foreignColumns: [t.id],
    }).onDelete("cascade"),
  ],
);

/* --------------------------- ARSIP DIGITAL --------------------------- */

export const arsip = pgTable(
  "arsip",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judul: varchar("judul", { length: 200 }).notNull(),
    deskripsi: text("deskripsi"),
    kategori: varchar("kategori", { length: 100 }),
    /** Kode klasifikasi arsip, mis. 3.1.1 Surat Keputusan. */
    kodeKlasifikasi: varchar("kode_klasifikasi", { length: 50 }),
    tahun: integer("tahun"),
    unitId: uuid("unit_id").references(() => unitKerja.id, { onDelete: "set null" }),
    fileUrl: text("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size"),
    fileType: varchar("file_type", { length: 50 }),
    tags: text("tags"),
    /** Tautan asal bila arsip berasal dari surat/berkas lain. */
    sumberTipe: varchar("sumber_tipe", { length: 30 }),
    sumberId: uuid("sumber_id"),
    uploadedBy: uuid("uploaded_by")
      .references(() => pegawai.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("arsip_tahun_idx").on(t.tahun),
    index("arsip_kategori_idx").on(t.kategori),
  ],
);


/* ----------------------------- RELATIONS ---------------------------- */

export const suratMasukRelations = relations(suratMasuk, ({ one, many }) => ({
  kategori: one(kategoriSurat, {
    fields: [suratMasuk.kategoriId],
    references: [kategoriSurat.id],
  }),
  pembuat: one(pegawai, {
    fields: [suratMasuk.createdBy],
    references: [pegawai.id],
    relationName: "suratMasukPembuat",
  }),
  disposisiOleh: one(pegawai, {
    fields: [suratMasuk.disposisiOlehId],
    references: [pegawai.id],
    relationName: "suratMasukDisposisiOleh",
  }),
  disposisi: many(disposisi),
}));

export const suratKeluarRelations = relations(suratKeluar, ({ one }) => ({
  kategori: one(kategoriSurat, {
    fields: [suratKeluar.kategoriId],
    references: [kategoriSurat.id],
  }),
  unit: one(unitKerja, { fields: [suratKeluar.unitId], references: [unitKerja.id] }),
  penandatangan: one(pegawai, {
    fields: [suratKeluar.penandatanganId],
    references: [pegawai.id],
    relationName: "suratKeluarPenandatangan",
  }),
  disetujuiOleh: one(pegawai, {
    fields: [suratKeluar.disetujuiOlehId],
    references: [pegawai.id],
    relationName: "suratKeluarDisetujuiOleh",
  }),
  pembuat: one(pegawai, {
    fields: [suratKeluar.createdBy],
    references: [pegawai.id],
    relationName: "suratKeluarPembuat",
  }),
}));

export const disposisiRelations = relations(disposisi, ({ one, many }) => ({
  surat: one(suratMasuk, {
    fields: [disposisi.suratMasukId],
    references: [suratMasuk.id],
  }),
  dari: one(pegawai, {
    fields: [disposisi.dariUserId],
    references: [pegawai.id],
    relationName: "disposisiDari",
  }),
  ke: one(pegawai, {
    fields: [disposisi.keUserId],
    references: [pegawai.id],
    relationName: "disposisiKe",
  }),
  induk: one(disposisi, {
    fields: [disposisi.indukId],
    references: [disposisi.id],
    relationName: "disposisiRantai",
  }),
  anak: many(disposisi, { relationName: "disposisiRantai" }),
}));

export const arsipRelations = relations(arsip, ({ one }) => ({
  unit: one(unitKerja, { fields: [arsip.unitId], references: [unitKerja.id] }),
  pengunggah: one(pegawai, {
    fields: [arsip.uploadedBy],
    references: [pegawai.id],
    relationName: "arsipPengunggah",
  }),
}));

export type SuratMasuk = typeof suratMasuk.$inferSelect;
export type SuratKeluar = typeof suratKeluar.$inferSelect;
export type Disposisi = typeof disposisi.$inferSelect;
export type Arsip = typeof arsip.$inferSelect;
