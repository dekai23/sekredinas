/**
 * Sesi pengguna.
 *
 * Sesi disimpan sebagai cookie httpOnly berisi JWT (jose). Isi cookie hanya
 * memuat id, nama, peran, dan role - TIDAK memuat data kepegawaian sensitif,
 * sehingga tetap aman bila cookie dibaca di sisi klien.
 *
 * Catatan keamanan (PRD 8.2):
 * - cookie httpOnly + sameSite=lax => tidak terbaca JavaScript, tidak dikirim
 *   pada permintaan lintas situs (mitigasi CSRF bersama pemeriksaan Origin
 *   pada server action).
 * - production: secure = true (hanya HTTPS).
 */
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const NAMA_COOKIE_SESI = "sekredinas_sesi";
const UMUR_SESI_DETIK = Number(process.env.SESSION_MAX_AGE || 60 * 60 * 8);

export type SesiPengguna = {
  id: string;
  nama: string;
  nip: string | null;
  peran: string;
  role: "admin" | "pimpinan" | "pegawai";
  unit: string | null;
  wajibGantiSandi: boolean;
};

function kunciRahasia(): Uint8Array {
  // `trim` wajib: berkas .env pada Windows bisa menyimpan akhir baris CRLF,
  // dan satu karakter tambahan membuat tanda tangan JWT tidak cocok.
  const rahasia = process.env.AUTH_SECRET?.trim();
  if (!rahasia || rahasia.length < 32) {
    throw new Error(
      "AUTH_SECRET belum diisi atau terlalu pendek (minimal 32 karakter). " +
        "Salin .env.example menjadi .env.local lalu isi nilainya.",
    );
  }
  return new TextEncoder().encode(rahasia);
}

export async function buatTokenSesi(data: SesiPengguna): Promise<string> {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${UMUR_SESI_DETIK}s`)
    .sign(kunciRahasia());
}

export async function bacaTokenSesi(token: string | undefined): Promise<SesiPengguna | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunciRahasia(), { algorithms: ["HS256"] });
    return {
      id: String(payload.id),
      nama: String(payload.nama),
      nip: (payload.nip as string | null) ?? null,
      peran: String(payload.peran ?? "pelaksana"),
      role: (payload.role as SesiPengguna["role"]) ?? "pegawai",
      unit: (payload.unit as string | null) ?? null,
      wajibGantiSandi: Boolean(payload.wajibGantiSandi),
    };
  } catch {
    return null;
  }
}

/** Membaca sesi dari cookie (aman dipanggil di server component). */
export async function sesiSaatIni(): Promise<SesiPengguna | null> {
  const toples = await cookies();
  return bacaTokenSesi(toples.get(NAMA_COOKIE_SESI)?.value);
}

export async function pasangCookieSesi(token: string): Promise<void> {
  const toples = await cookies();
  toples.set(NAMA_COOKIE_SESI, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI_DETIK,
  });
}

export async function hapusCookieSesi(): Promise<void> {
  const toples = await cookies();
  toples.delete(NAMA_COOKIE_SESI);
}
