CREATE TYPE "public"."jenis_unit" AS ENUM('badan', 'sekretariat', 'sub_bagian', 'bidang', 'sub_bidang', 'kelompok_jabatan_fungsional');--> statement-breakpoint
CREATE TYPE "public"."kondisi_aset" AS ENUM('baik', 'rusak_ringan', 'rusak_berat');--> statement-breakpoint
CREATE TYPE "public"."peran" AS ENUM('kepala_badan', 'sekretaris', 'kepala_bidang', 'kepala_sub_bagian', 'kepala_sub_bidang', 'plt_kepala_sub_bidang', 'plt_kepala_sub_bagian', 'fungsional', 'pelaksana');--> statement-breakpoint
CREATE TYPE "public"."prioritas" AS ENUM('biasa', 'penting', 'segera', 'rahasia');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'pimpinan', 'pegawai');--> statement-breakpoint
CREATE TYPE "public"."status_cuti" AS ENUM('menunggu', 'disetujui', 'ditolak');--> statement-breakpoint
CREATE TYPE "public"."status_disposisi" AS ENUM('menunggu', 'diproses', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."status_surat" AS ENUM('draft', 'diajukan', 'terkirim', 'dibaca', 'didisposisi', 'selesai', 'arsip');--> statement-breakpoint
CREATE TABLE "kategori_surat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(120) NOT NULL,
	"kode" varchar(10) NOT NULL,
	"uraian" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomor_urut" (
	"konteks" varchar(80) PRIMARY KEY NOT NULL,
	"nilai" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pegawai" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nip" varchar(30),
	"nama_lengkap" varchar(150) NOT NULL,
	"pangkat" varchar(80),
	"golongan" varchar(20),
	"pangkat_golongan" varchar(120),
	"jenis_jabatan" varchar(40),
	"jabatan" varchar(200),
	"eselon" varchar(20),
	"status_pegawai" varchar(30) DEFAULT 'PNS' NOT NULL,
	"peran" "peran" DEFAULT 'pelaksana' NOT NULL,
	"unit_id" uuid,
	"email" varchar(150) NOT NULL,
	"password_hash" text,
	"role" "role" DEFAULT 'pegawai' NOT NULL,
	"wajib_ganti_password" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"aktif" boolean DEFAULT true NOT NULL,
	"telepon" varchar(20),
	"avatar_url" text,
	"sisa_cuti" integer DEFAULT 12 NOT NULL,
	"tahun_cuti" integer,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengaturan" (
	"kunci" varchar(80) PRIMARY KEY NOT NULL,
	"nilai" text,
	"keterangan" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_kerja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(200) NOT NULL,
	"kode" varchar(20) NOT NULL,
	"jenis" "jenis_unit" DEFAULT 'sub_bidang' NOT NULL,
	"induk_id" uuid,
	"urutan" integer DEFAULT 0 NOT NULL,
	"pejabat_eselon" varchar(10),
	"publik" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arsip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judul" varchar(200) NOT NULL,
	"deskripsi" text,
	"kategori" varchar(100),
	"kode_klasifikasi" varchar(50),
	"tahun" integer,
	"unit_id" uuid,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"file_type" varchar(50),
	"tags" text,
	"sumber_tipe" varchar(30),
	"sumber_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disposisi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surat_masuk_id" uuid NOT NULL,
	"dari_user_id" uuid NOT NULL,
	"ke_user_id" uuid NOT NULL,
	"instruksi" text NOT NULL,
	"catatan" text,
	"level" integer DEFAULT 1 NOT NULL,
	"induk_id" uuid,
	"batas_waktu" date,
	"status" "status_disposisi" DEFAULT 'menunggu' NOT NULL,
	"dibaca_pada" timestamp with time zone,
	"selesai_pada" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surat_keluar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor_surat" varchar(100),
	"tanggal_surat" date NOT NULL,
	"unit_id" uuid,
	"tujuan" varchar(200) NOT NULL,
	"perihal" text NOT NULL,
	"kategori_id" uuid,
	"sifat" "prioritas" DEFAULT 'biasa' NOT NULL,
	"isi_surat" text,
	"paraf_untuk" text,
	"file_url" text,
	"file_name" varchar(255),
	"file_size" integer,
	"status" "status_surat" DEFAULT 'draft' NOT NULL,
	"terkunci" boolean DEFAULT false NOT NULL,
	"penandatangan_id" uuid,
	"disetujui_oleh_id" uuid,
	"disetujui_pada" timestamp with time zone,
	"catatan_persetetujuan" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surat_masuk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor_agenda" varchar(50) NOT NULL,
	"nomor_surat" varchar(100),
	"tanggal_surat" date NOT NULL,
	"tanggal_terima" date NOT NULL,
	"asal_surat" varchar(200) NOT NULL,
	"perihal" text NOT NULL,
	"kategori_id" uuid,
	"sifat" "prioritas" DEFAULT 'biasa' NOT NULL,
	"file_url" text,
	"file_name" varchar(255),
	"file_size" integer,
	"status" "status_surat" DEFAULT 'terkirim' NOT NULL,
	"catatan" text,
	"disposisi_oleh_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judul" varchar(200) NOT NULL,
	"deskripsi" text,
	"lokasi" varchar(200),
	"mulai" timestamp with time zone NOT NULL,
	"selesai" timestamp with time zone,
	"jenis" varchar(50) DEFAULT 'rapat' NOT NULL,
	"publik" boolean DEFAULT false NOT NULL,
	"penanggung_jawab_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"aksi" varchar(40) NOT NULL,
	"entitas" varchar(40) NOT NULL,
	"entitas_id" uuid,
	"perubahan" text,
	"ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "berita" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judul" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"ringkasan" text,
	"isi" text NOT NULL,
	"gambar_url" text,
	"kategori" varchar(50) DEFAULT 'kegiatan' NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"publik" boolean DEFAULT false NOT NULL,
	"tanggal_terbit" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cuti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pegawai_id" uuid NOT NULL,
	"jenis_cuti" varchar(30) NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"total_hari" integer NOT NULL,
	"alasan" text NOT NULL,
	"alamat_tujuan" varchar(200),
	"kontak" varchar(50),
	"lampiran_url" text,
	"status" "status_cuti" DEFAULT 'menunggu' NOT NULL,
	"disetujui_oleh_id" uuid,
	"disetujui_pada" timestamp with time zone,
	"catatan_persetujuan" text,
	"sisa_cuti_setelah" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventaris" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode_aset" varchar(50) NOT NULL,
	"nama_aset" varchar(200) NOT NULL,
	"kategori" varchar(100) NOT NULL,
	"merek" varchar(100),
	"tahun_perolehan" integer,
	"jumlah" integer DEFAULT 1 NOT NULL,
	"satuan" varchar(20) DEFAULT 'unit' NOT NULL,
	"kondisi" "kondisi_aset" DEFAULT 'baik' NOT NULL,
	"lokasi" varchar(200),
	"nilai_perolehan" integer,
	"nomor_polisi" varchar(30),
	"nomor_bmn" varchar(30),
	"sumber_dana" varchar(100),
	"penanggung_jawab_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layanan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judul" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"ringkasan" text,
	"deskripsi" text NOT NULL,
	"syarat" text,
	"alur" text,
	"waktu_penyelesaian" varchar(60),
	"dasar_hukum" text,
	"unit_id" uuid,
	"urutan" integer DEFAULT 0 NOT NULL,
	"publik" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifikasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"judul" varchar(200) NOT NULL,
	"pesan" text NOT NULL,
	"tipe" varchar(40) DEFAULT 'sistem' NOT NULL,
	"link" text,
	"dibaca" boolean DEFAULT false NOT NULL,
	"dibaca_pada" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengumuman" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judul" varchar(200) NOT NULL,
	"ringkasan" text,
	"isi" text NOT NULL,
	"prioritas" "prioritas" DEFAULT 'biasa' NOT NULL,
	"kategori" varchar(40) DEFAULT 'pengumuman' NOT NULL,
	"internal" boolean DEFAULT true NOT NULL,
	"publik" boolean DEFAULT false NOT NULL,
	"lampiran_url" text,
	"tanggal_mulai" timestamp with time zone DEFAULT now() NOT NULL,
	"tanggal_berakhir" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pegawai" ADD CONSTRAINT "pegawai_unit_id_unit_kerja_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit_kerja"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_kerja" ADD CONSTRAINT "unit_kerja_induk_fk" FOREIGN KEY ("induk_id") REFERENCES "public"."unit_kerja"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_unit_id_unit_kerja_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit_kerja"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arsip" ADD CONSTRAINT "arsip_uploaded_by_pegawai_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_surat_masuk_id_surat_masuk_id_fk" FOREIGN KEY ("surat_masuk_id") REFERENCES "public"."surat_masuk"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_dari_user_id_pegawai_id_fk" FOREIGN KEY ("dari_user_id") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_ke_user_id_pegawai_id_fk" FOREIGN KEY ("ke_user_id") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_induk_fk" FOREIGN KEY ("induk_id") REFERENCES "public"."disposisi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_unit_id_unit_kerja_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit_kerja"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_kategori_id_kategori_surat_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori_surat"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_penandatangan_id_pegawai_id_fk" FOREIGN KEY ("penandatangan_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_disetujui_oleh_id_pegawai_id_fk" FOREIGN KEY ("disetujui_oleh_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_keluar" ADD CONSTRAINT "surat_keluar_created_by_pegawai_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_masuk" ADD CONSTRAINT "surat_masuk_kategori_id_kategori_surat_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."kategori_surat"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_masuk" ADD CONSTRAINT "surat_masuk_disposisi_oleh_id_pegawai_id_fk" FOREIGN KEY ("disposisi_oleh_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat_masuk" ADD CONSTRAINT "surat_masuk_created_by_pegawai_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_penanggung_jawab_id_pegawai_id_fk" FOREIGN KEY ("penanggung_jawab_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_created_by_pegawai_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_pegawai_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "berita" ADD CONSTRAINT "berita_created_by_pegawai_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuti" ADD CONSTRAINT "cuti_pegawai_id_pegawai_id_fk" FOREIGN KEY ("pegawai_id") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuti" ADD CONSTRAINT "cuti_disetujui_oleh_id_pegawai_id_fk" FOREIGN KEY ("disetujui_oleh_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventaris" ADD CONSTRAINT "inventaris_penanggung_jawab_id_pegawai_id_fk" FOREIGN KEY ("penanggung_jawab_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layanan" ADD CONSTRAINT "layanan_unit_id_unit_kerja_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit_kerja"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layanan" ADD CONSTRAINT "layanan_created_by_pegawai_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_pegawai_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pegawai"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengumuman" ADD CONSTRAINT "pengumuman_created_by_pegawai_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pegawai"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kategori_surat_kode_key" ON "kategori_surat" USING btree ("kode");--> statement-breakpoint
CREATE UNIQUE INDEX "pegawai_nip_key" ON "pegawai" USING btree ("nip");--> statement-breakpoint
CREATE UNIQUE INDEX "pegawai_email_key" ON "pegawai" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pegawai_unit_idx" ON "pegawai" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "pegawai_role_idx" ON "pegawai" USING btree ("role");--> statement-breakpoint
CREATE INDEX "pegawai_peran_idx" ON "pegawai" USING btree ("peran");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_kerja_kode_key" ON "unit_kerja" USING btree ("kode");--> statement-breakpoint
CREATE INDEX "unit_kerja_induk_idx" ON "unit_kerja" USING btree ("induk_id");--> statement-breakpoint
CREATE INDEX "arsip_tahun_idx" ON "arsip" USING btree ("tahun");--> statement-breakpoint
CREATE INDEX "arsip_kategori_idx" ON "arsip" USING btree ("kategori");--> statement-breakpoint
CREATE INDEX "disposisi_surat_idx" ON "disposisi" USING btree ("surat_masuk_id");--> statement-breakpoint
CREATE INDEX "disposisi_ke_idx" ON "disposisi" USING btree ("ke_user_id");--> statement-breakpoint
CREATE INDEX "disposisi_status_idx" ON "disposisi" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disposisi_induk_idx" ON "disposisi" USING btree ("induk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "surat_keluar_nomor_key" ON "surat_keluar" USING btree ("nomor_surat");--> statement-breakpoint
CREATE INDEX "surat_keluar_tanggal_idx" ON "surat_keluar" USING btree ("tanggal_surat");--> statement-breakpoint
CREATE INDEX "surat_keluar_status_idx" ON "surat_keluar" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surat_keluar_unit_idx" ON "surat_keluar" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "surat_masuk_agenda_key" ON "surat_masuk" USING btree ("nomor_agenda");--> statement-breakpoint
CREATE INDEX "surat_masuk_tanggal_idx" ON "surat_masuk" USING btree ("tanggal_terima");--> statement-breakpoint
CREATE INDEX "surat_masuk_status_idx" ON "surat_masuk" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surat_masuk_kategori_idx" ON "surat_masuk" USING btree ("kategori_id");--> statement-breakpoint
CREATE INDEX "agenda_mulai_idx" ON "agenda" USING btree ("mulai");--> statement-breakpoint
CREATE INDEX "agenda_publik_idx" ON "agenda" USING btree ("publik");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entitas_idx" ON "audit_log" USING btree ("entitas","entitas_id");--> statement-breakpoint
CREATE INDEX "audit_log_waktu_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "berita_slug_key" ON "berita" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "berita_publik_idx" ON "berita" USING btree ("publik","tanggal_terbit");--> statement-breakpoint
CREATE INDEX "cuti_pegawai_idx" ON "cuti" USING btree ("pegawai_id");--> statement-breakpoint
CREATE INDEX "cuti_status_idx" ON "cuti" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cuti_mulai_idx" ON "cuti" USING btree ("tanggal_mulai");--> statement-breakpoint
CREATE UNIQUE INDEX "inventaris_kode_key" ON "inventaris" USING btree ("kode_aset");--> statement-breakpoint
CREATE INDEX "inventaris_kategori_idx" ON "inventaris" USING btree ("kategori");--> statement-breakpoint
CREATE INDEX "inventaris_kondisi_idx" ON "inventaris" USING btree ("kondisi");--> statement-breakpoint
CREATE UNIQUE INDEX "layanan_slug_key" ON "layanan" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "layanan_publik_idx" ON "layanan" USING btree ("publik","urutan");--> statement-breakpoint
CREATE INDEX "notifikasi_user_idx" ON "notifikasi" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifikasi_baca_idx" ON "notifikasi" USING btree ("user_id","dibaca");--> statement-breakpoint
CREATE INDEX "pengumuman_publik_idx" ON "pengumuman" USING btree ("publik");--> statement-breakpoint
CREATE INDEX "pengumuman_mulai_idx" ON "pengumuman" USING btree ("tanggal_mulai");