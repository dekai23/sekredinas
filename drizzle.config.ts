import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit hanya dipakai untuk membuat berkas migrasi SQL dan membandingkan
 * skema dengan basis data (studio). Jalankan `npm run db:generate` setelah
 * mengubah lib/db/schema*.ts, lalu `npm run db:migrate` untuk menerapkan.
 *
 * Catatan: skema sengaja memakai `pgEnum` dan tipe native PostgreSQL, sehingga
 * targetnya selalu PostgreSQL. Saat DATABASE_URL kosong, aplikasi memakai PGlite
 * (PostgreSQL tertanam) agar tetap bisa dijalankan di komputer kantor tanpa
 * memasang server database.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  // Dipakai hanya bila menjalankan `drizzle-kit push`/`studio` ke PostgreSQL nyata.
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sekredinas",
  },
});
