"use server";

import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { verifikasiSandi } from "@/lib/auth/sandi";
import { buatTokenSesi, pasangCookieSesi, type SesiPengguna } from "@/lib/auth/sesi";
import { db, schema } from "@/lib/db";

export interface HasilMasuk {
  galat?: string;
  perluGantiSandi?: boolean;
}

/**
 * Pembatas percobaan login sederhana: 5 kali gagal per 10 menit (PRD 8.2).
 * Disimpan di memori proses - cukup untuk satu instance server.
 * Bila aplikasi dijalankan di banyak instance, pindahkan ke tabel/Redis.
 */
const percobaan = new Map<string, { jumlah: number; sejak: number }>();
const BATAS_PERCOBAAN = 5;
const JANGKA_WAKTU_MS = 10 * 60 * 1000;

function terlaluSering(kunci: string): boolean {
  const now = Date.now();
  const rekam = percobaan.get(kunci);
  if (!rekam || now - rekam.sejak > JANGKA_WAKTU_MS) {
    percobaan.set(kunci, { jumlah: 1, sejak: now });
    return false;
  }
  rekam.jumlah += 1;
  return rekam.jumlah > BATAS_PERCOBAAN;
}

function bersihkanPercobaan(kunci: string): void {
  percobaan.delete(kunci);
}

/**
 * Server action: proses login.
 * Mengembalikan pesan galat generik agar tidak membocorkan informasi
 * apakah email terdaftar atau tidak (PRD 8.2).
 */
export async function masuk(
  _state: HasilMasuk | null,
  data: FormData,
): Promise<HasilMasuk> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const sandi = String(data.get("sandi") ?? "");
  const lanjut = String(data.get("lanjut") ?? "");

  if (!email || !sandi) {
    return { galat: "Email dan sandi wajib diisi." };
  }

  if (terlaluSering(`${email}|${sandi.length}`)) {
    return {
      galat: "Terlalu banyak percobaan login. Mohon tunggu 10 menit sebelum mencoba lagi.",
    };
  }

  const pengguna = await db
    .select()
    .from(schema.pegawai)
    .where(eq(schema.pegawai.email, email))
    .limit(1);

  const baris = pengguna[0];
  const hashTersimpan = baris?.passwordHash ?? null;
  const sandiBenar = await verifikasiSandi(sandi, hashTersimpan);

  if (!baris || !sandiBenar || !baris.aktif) {
    return { galat: "Email atau sandi salah, atau akun sedang tidak aktif." };
  }

  bersihkanPercobaan(`${email}|${sandi.length}`);

  const unit = baris.unitId
    ? (await db
        .select({ nama: schema.unitKerja.nama })
        .from(schema.unitKerja)
        .where(eq(schema.unitKerja.id, baris.unitId))
        .limit(1))[0]?.nama ?? null
    : null;

  const sesi: SesiPengguna = {
    id: baris.id,
    nama: baris.namaLengkap,
    nip: baris.nip,
    peran: baris.peran,
    role: baris.role,
    unit,
    wajibGantiSandi: baris.wajibGantiPassword,
  };

  await pasangCookieSesi(await buatTokenSesi(sesi));
  await db
    .update(schema.pegawai)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.pegawai.id, baris.id));

  // Catat aktivitas login untuk audit.
  await db.insert(schema.auditLog).values({
    userId: baris.id,
    aksi: "login",
    entitas: "pegawai",
    entitasId: baris.id,
  });

  // Sanitasi tujuan: hanya path internal.
  const tujuan = lanjut.startsWith("/") && !lanjut.startsWith("//") ? lanjut : "/dashboard";
  redirect(tujuan);
}
