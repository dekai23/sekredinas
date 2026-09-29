"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  buatInventaris as buat,
  hapusInventaris as hapus,
  ubahInventaris as ubah,
} from "@/lib/operasi/inventaris";
import type { HasilForm } from "@/lib/validasi/konten";

export async function buatInventaris(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/inventaris");
  if (!boleh(sesi, "inventaris.kelola")) return { galat: "Anda tidak berwenang menambah aset." };

  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) revalidatePath("/dashboard/inventaris");
  return hasil;
}

export async function ubahInventaris(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/inventaris");
  if (!boleh(sesi, "inventaris.kelola")) return { galat: "Anda tidak berwenang mengubah aset." };

  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) revalidatePath("/dashboard/inventaris");
  return hasil;
}

export async function hapusInventaris(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/inventaris");
  if (!boleh(sesi, "inventaris.kelola")) return { galat: "Anda tidak berwenang menghapus aset." };

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/inventaris");
  return hasil;
}
