/**
 * Menerapkan migrasi SQL hasil `npm run db:generate`.
 *
 *   DATABASE_URL kosong  -> PGlite (folder .database/sekredinas)
 *   DATABASE_URL terisi  -> PostgreSQL sungguhan
 *
 * Contoh:
 *   npm run db:migrate
 *   npm run db:migrate -- --status   (hanya menampilkan status)
 *   npm run db:migrate -- --reset    (menghapus & membangun ulang basis data)
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

import * as schema from "../lib/db/schema";

const DIREKTORI_MIGRASI = resolve(process.cwd(), "drizzle");
const args = new Set(process.argv.slice(2));

async function utama() {
  const url = process.env.DATABASE_URL?.trim();

  if (args.has("--reset")) {
    if (url) {
      throw new Error(
        "--reset hanya untuk PGlite. Untuk PostgreSQL sungguhan gunakan drizzle-kit push atau hapus basis data secara manual.",
      );
    }
    const dir = resolve(process.cwd(), process.env.PGDATA_DIR?.trim() || ".database/sekredinas");
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      console.log(`[migrate] basis data dev dihapus: ${dir}`);
    }
  }

  if (!existsSync(DIREKTORI_MIGRASI)) {
    throw new Error(
      "Folder ./drizzle belum ada. Jalankan `npm run db:generate` terlebih dahulu.",
    );
  }

  if (url) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 1, onnotice: () => {} });
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: DIREKTORI_MIGRASI, migrationsSchema: "public" });
    await client.end();
    console.log("[migrate] migrasi diterapkan ke PostgreSQL.");
    return;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGDATA_DIR?.trim() || ".database/sekredinas";
  // PGlite tidak membuat folder induk sendiri, jadi pastikan lebih dulu.
  mkdirSync(dirname(resolve(process.cwd(), dir)), { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema, casing: "snake_case" });
  // PGlite hanya mengenal satu skema; pakai `public` untuk tabel riwayat migrasi.
  await migrate(db, { migrationsFolder: DIREKTORI_MIGRASI, migrationsSchema: "public" });
  await client.close();
  console.log(`[migrate] migrasi diterapkan ke PGlite (${dir}).`);
}

utama().catch((galat: unknown) => {
  console.error("[migrate] GAGAL:", galat instanceof Error ? galat.message : galat);
  process.exitCode = 1;
});
