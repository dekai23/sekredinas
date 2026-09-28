import { compare, hash } from "bcryptjs";

/**
 * Pengamanan sandi. bcrypt dengan 10 rounds: cukup kuat untuk aplikasi
 * instansi ini dan tetap cepat pada server yang sederhana.
 * Tidak pernah menyimpan sandi dalam bentuk biasa.
 */
const ROUNDS = 10;

export function hashSandi(sandi: string): Promise<string> {
  return hash(sandi, ROUNDS);
}

export function verifikasiSandi(sandi: string, hashTersimpan: string | null): Promise<boolean> {
  if (!hashTersimpan) return Promise.resolve(false);
  return compare(sandi, hashTersimpan);
}

export interface AturanSandi {
  valid: boolean;
  pesan: string;
}

/**
 * Aturan sandi untuk lingkungan internal (PRD 8.2):
 * minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol.
 */
export function periksaSandi(sandi: string): AturanSandi {
  if (sandi.length < 8) {
    return { valid: false, pesan: "Sandi minimal 8 karakter." };
  }
  if (!/[A-Z]/.test(sandi)) {
    return { valid: false, pesan: "Sandi harus memuat huruf besar (A-Z)." };
  }
  if (!/[a-z]/.test(sandi)) {
    return { valid: false, pesan: "Sandi harus memuat huruf kecil (a-z)." };
  }
  if (!/[0-9]/.test(sandi)) {
    return { valid: false, pesan: "Sandi harus memuat angka." };
  }
  if (!/[^A-Za-z0-9]/.test(sandi)) {
    return { valid: false, pesan: "Sandi harus memuat minimal satu simbol." };
  }
  return { valid: true, pesan: "Sandi memenuhi ketentuan." };
}
