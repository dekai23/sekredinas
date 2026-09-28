"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import type { SesiPengguna } from "@/lib/auth/sesi";
import {
  buatDisposisi as buat,
  selesaikanDisposisi as selesai,
  tandaiDibaca as tandai,
} from "@/lib/operasi/disposisi";
import type { HasilForm } from "@/lib/validasi/surat";

/** Menerjemahkan sesi pengguna menjadi profil aktor bagi logika bisnis. */
function aktor(sesi: SesiPengguna) {
  return {
    id: sesi.id,
    nama: sesi.nama,
    bolehDisposisi: boleh(sesi, "disposisi.buat"),
    admin: sesi.role === "admin",
  };
}

/** Server action: memberikan disposisi berantai (PRD 6.D). */
export async function buatDisposisi(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/disposisi");
  const hasil = await buat(aktor(sesi), form);
  if (hasil.sukses) {
    revalidatePath(`/dashboard/surat-masuk/${String(form.get("suratMasukId") ?? "")}`);
    revalidatePath("/dashboard/disposisi");
  }
  return hasil;
}

/** Server action: menutup disposisi dengan catatan tindak lanjut (PRD 6.D). */
export async function selesaikanDisposisi(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/disposisi");
  const hasil = await selesai(aktor(sesi), form);
  revalidatePath("/dashboard/disposisi");
  return hasil;
}

/** Server action: menandai disposisi sudah dibaca. */
export async function tandaiDibaca(disposisiId: string): Promise<void> {
  const sesi = await wajibMasuk("dashboard/disposisi");
  await tandai(sesi.id, disposisiId);
  revalidatePath("/dashboard/disposisi");
}
