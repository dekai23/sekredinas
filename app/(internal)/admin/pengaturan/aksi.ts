"use server";

import { revalidatePath } from "next/cache";

import { wajibRole } from "@/lib/auth/hak-akses";
import { simpanPengaturan as simpan } from "@/lib/operasi/master";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menyimpan identitas instansi (admin). */
export async function simpanPengaturan(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/pengaturan");
  const hasil = await simpan(sesi.id, form);
  if (hasil.sukses) {
    revalidatePath("/admin/pengaturan");
    revalidatePath("/", "layout");
  }
  return hasil;
}
