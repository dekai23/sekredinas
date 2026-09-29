"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  buatAgenda as buat,
  hapusAgenda as hapus,
  ubahAgenda as ubah,
} from "@/lib/operasi/agenda";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menambah agenda kegiatan (PRD 6.F). */
export async function buatAgenda(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/agenda");
  if (!boleh(sesi, "agenda.kelola")) return { galat: "Anda tidak berwenang menambah agenda." };

  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/agenda");
    revalidatePath("/agenda");
  }
  return hasil;
}

/** Server action: mengubah agenda. */
export async function ubahAgenda(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/agenda");
  if (!boleh(sesi, "agenda.kelola")) return { galat: "Anda tidak berwenang mengubah agenda." };

  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/agenda");
    revalidatePath("/agenda");
  }
  return hasil;
}

/** Server action: menghapus agenda. */
export async function hapusAgenda(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/agenda");
  if (!boleh(sesi, "agenda.kelola")) return { galat: "Anda tidak berwenang menghapus agenda." };

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/agenda");
  revalidatePath("/agenda");
  return hasil;
}
