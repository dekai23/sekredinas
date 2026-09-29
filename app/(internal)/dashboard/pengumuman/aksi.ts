"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  buatPengumuman as buat,
  hapusPengumuman as hapus,
  ubahPengumuman as ubah,
} from "@/lib/operasi/pengumuman";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menerbitkan pengumuman (PRD 6.H). */
export async function buatPengumuman(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/pengumuman");
  if (!boleh(sesi, "pengumuman.kelola")) {
    return { galat: "Anda tidak berwenang menerbitkan pengumuman." };
  }

  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/pengumuman");
    revalidatePath("/pengumuman");
    revalidatePath("/");
  }
  return hasil;
}

/** Server action: mengubah pengumuman. */
export async function ubahPengumuman(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/pengumuman");
  if (!boleh(sesi, "pengumuman.kelola")) {
    return { galat: "Anda tidak berwenang mengubah pengumuman." };
  }

  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/pengumuman");
    revalidatePath("/pengumuman");
    revalidatePath("/");
  }
  return hasil;
}

/** Server action: menghapus pengumuman. */
export async function hapusPengumuman(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/pengumuman");
  if (!boleh(sesi, "pengumuman.kelola")) {
    return { galat: "Anda tidak berwenang menghapus pengumuman." };
  }

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/pengumuman");
  revalidatePath("/pengumuman");
  revalidatePath("/");
  return hasil;
}
