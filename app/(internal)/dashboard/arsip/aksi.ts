"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { hapusArsip as hapus, unggahArsip as unggah } from "@/lib/operasi/arsip";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: mengunggah berkas arsip (PRD 6.E). */
export async function unggahArsip(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/arsip");
  if (!boleh(sesi, "arsip.kelola")) {
    return { galat: "Anda tidak berwenang mengunggah arsip." };
  }

  const hasil = await unggah(sesi.id, form);
  if (hasil.sukses) revalidatePath("/dashboard/arsip");
  return hasil;
}

/** Server action: menghapus berkas arsip. */
export async function hapusArsip(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/arsip");
  if (!boleh(sesi, "arsip.kelola")) {
    return { galat: "Anda tidak berwenang menghapus arsip." };
  }

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/arsip");
  return hasil;
}
