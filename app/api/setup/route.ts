/**
 * Route setup sekali pakai untuk menyiapkan database di lingkungan deploy
 * (Netlify), karena variabel database baru tersedia saat runtime.
 *
 * Menjalankan: migrasi tabel + pengisian data awal (seed).
 *
 * Pemakaian: buka
 *   /api/setup?kunci=<KUNCI>
 * Tambahkan &paksa=1 untuk memaksa seed meski sudah ada data.
 *
 * HAPUS berkas ini setelah database selesai disiapkan.
 */
import { join } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { NextResponse } from "next/server";
import postgres from "postgres";

import { jalankanSeed } from "@/scripts/seed";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KUNCI = "sekredinas2026siapkan";

function pesanGalat(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (params.get("kunci") !== KUNCI) {
    return NextResponse.json({ galat: "Tidak diizinkan." }, { status: 403 });
  }

  const url =
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DB_URL;
  if (!url) {
    return NextResponse.json({ galat: "URL database tidak ditemukan." }, { status: 500 });
  }

  const log: string[] = [];

  try {
    const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
    await client.end();
    log.push("migrasi: selesai");
  } catch (e) {
    return NextResponse.json({ galat: `migrasi: ${pesanGalat(e)}`, log }, { status: 500 });
  }

  try {
    await jalankanSeed({ paksa: params.get("paksa") === "1" });
    log.push("seed: selesai");
  } catch (e) {
    return NextResponse.json({ galat: `seed: ${pesanGalat(e)}`, log }, { status: 500 });
  }

  return NextResponse.json({ sukses: true, log });
}
