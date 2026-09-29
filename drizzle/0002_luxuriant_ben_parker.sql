CREATE TYPE "public"."status_absensi" AS ENUM('hadir', 'izin', 'sakit', 'cuti', 'dinas_luar', 'alpa');--> statement-breakpoint
CREATE TABLE "absensi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pegawai_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"jam_masuk" timestamp with time zone,
	"jam_pulang" timestamp with time zone,
	"status" "status_absensi" DEFAULT 'hadir' NOT NULL,
	"keterangan" text,
	"dicatat_oleh_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_pegawai_id_pegawai_id_fk" FOREIGN KEY ("pegawai_id") REFERENCES "public"."pegawai"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_dicatat_oleh_id_pegawai_id_fk" FOREIGN KEY ("dicatat_oleh_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "absensi_pegawai_tanggal_key" ON "absensi" USING btree ("pegawai_id","tanggal");--> statement-breakpoint
CREATE INDEX "absensi_tanggal_idx" ON "absensi" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "absensi_status_idx" ON "absensi" USING btree ("status");