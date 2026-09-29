/**
 * Koneksi basis data.
 *
 * - Bila `DATABASE_URL` terisi  -> memakai PostgreSQL sungguhan (postgres.js).
 * - Bila kosong                 -> memakai PGlite (PostgreSQL tertanam di WASM),
 *   data disimpan di folder `PGDATA_DIR` (default .database/sekredinas).
 *
 * PGlite dipilih supaya aplikasi dapat dijalankan & diuji di komputer kantor
 * BKPSDM tanpa memasang server database dan tanpa koneksi internet, lalu
 * dipindahkan ke PostgreSQL server hanya dengan mengisi DATABASE_URL.
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __sekredinasDb?: Database;
};

/**
 * Alamat database PostgreSQL.
 *
 * Mendukung `DATABASE_URL` (umum) sekaligus variabel yang disediakan otomatis
 * oleh Netlify DB (Neon) yaitu `NETLIFY_DATABASE_URL`, agar deploy di Netlify
 * tidak perlu konfigurasi tambahan.
 */
function urlDatabase(): string | undefined {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.NETLIFY_DATABASE_URL?.trim() ||
    process.env.NETLIFY_DB_URL?.trim() ||
    undefined
  );
}

/**
 * Pembuat koneksi (versi async; dipakai oleh skrip migrate/seed).
 * Dipisahkan dari `db` agar skrip dapat membuka koneksi sendiri.
 */
export async function buatKoneksi(): Promise<Database> {
  const url = urlDatabase();

  if (url) {
    // Diimpor dinamis: paket `postgres` hanya dibutuhkan bila DATABASE_URL
    // terisi, sehingga tidak perlu ikut terpecah saat aplikasi memakai PGlite.
    const { default: postgres } = await import("postgres");
    const client = postgres(url, {
      max: 10,
      // prepared statement dimatikan bila berada di belakang pooler.
      prepare: false,
      onnotice: () => {},
    });
    return drizzlePostgres(client, { schema, casing: "snake_case" });
  }

  // PGlite tidak membuat folder induk sendiri, jadi siapkan dulu.
  const client = new PGlite(siapkanFolderPGlite());
  return drizzlePglite(client, { schema, casing: "snake_case" }) as unknown as Database;
}

/**
 * Membuat folder tempat PGlite menyimpan data.
 *
 * Catatan `turbopackIgnore` sengaja dipasang: tanpa itu, analisis statis
 * menganggap akses `resolve(process.cwd(), ...)` menelusuri seluruh proyek
 * sehingga semua berkas ikut terbawa ke hasil build.
 */
function siapkanFolderPGlite(): string {
  const dir = process.env.PGDATA_DIR?.trim() || ".database/sekredinas";
  mkdirSync(dirname(/* turbopackIgnore: true */ resolve(process.cwd(), dir)), {
    recursive: true,
  });
  return dir;
}

/**
 * Koneksi tunggal yang dipakai seluruh server component & server action.
 *
 * Sengaja diekspor sebagai *lazy proxy*: modul ini diimpor oleh banyak berkas,
 * dan sebagian ikut terbawa ke bundel klien (mis. melalui import dari client
 * component). Dengan begitu PGlite/postgres baru dimuat ketika kueri pertama
 * benar-benar dijalankan di server.
 */
let koneksi: Database | undefined;

export const db: Database = new Proxy({} as Database, {
  get(_target, properti) {
    if (!koneksi) {
      koneksi = globalForDb.__sekredinasDb ?? buatKoneksiSinkron();
      if (process.env.NODE_ENV !== "production") {
        globalForDb.__sekredinasDb = koneksi;
      }
    }
    const nilai = Reflect.get(koneksi as object, properti);
    return typeof nilai === "function" ? nilai.bind(koneksi) : nilai;
  },
}) as Database;

/** Versi sinkron: `postgres` dimuat hanya bila DATABASE_URL benar-benar terisi. */
function buatKoneksiSinkron(): Database {
  const url = urlDatabase();

  if (!url) {
    const client = new PGlite(siapkanFolderPGlite());
    return drizzlePglite(client, { schema, casing: "snake_case" }) as unknown as Database;
  }

  // createRequire dipakai agar `postgres` (paket CJS yang memuat modul node
  // seperti tls/net) hanya dimuat bila DATABASE_URL benar-benar terisi.
  const butuhModul = createRequire(import.meta.url);
  const modul = butuhModul("postgres") as
    | typeof import("postgres")
    | { default: typeof import("postgres") };
  const postgres = ("default" in modul ? modul.default : modul) as typeof import("postgres");
  const client = postgres(url, { max: 10, prepare: false, onnotice: () => {} });
  return drizzlePostgres(client, { schema, casing: "snake_case" });
}

export { schema };
