"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  buatLayanan as buat,
  hapusLayanan as hapus,
  ubahLayanan as ubah,
} from "@/lib/operasi/layanan";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menambah layanan publik (admin). */
export async function buatLayanan(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/layanan");
  if (!boleh(sesi, "layanan.kelola")) return { galat: "Anda tidak berwenang mengelola layanan." };

  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/layanan");
    revalidatePath("/layanan");
    revalidatePath("/");
  }
  return hasil;
}

export async function ubahLayanan(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/layanan");
  if (!boleh(sesi, "layanan.kelola")) return { galat: "Anda tidak berwenang mengelola layanan." };

  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/layanan");
    revalidatePath("/layanan");
    revalidatePath("/");
  }
  return hasil;
}

export async function hapusLayanan(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/layanan");
  if (!boleh(sesi, "layanan.kelola")) return { galat: "Anda tidak berwenang mengelola layanan." };

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/layanan");
  revalidatePath("/layanan");
  return hasil;
}
