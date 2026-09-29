"use server";

import { revalidatePath } from "next/cache";

import { wajibRole } from "@/lib/auth/hak-akses";
import {
  buatUnitKerja as buat,
  hapusUnitKerja as hapus,
  ubahUnitKerja as ubah,
} from "@/lib/operasi/master";
import type { HasilForm } from "@/lib/validasi/konten";

export async function buatUnitKerja(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/unit-kerja");
  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) revalidatePath("/admin/unit-kerja");
  return hasil;
}

export async function ubahUnitKerja(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/unit-kerja");
  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) revalidatePath("/admin/unit-kerja");
  return hasil;
}

export async function hapusUnitKerja(id: string): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/unit-kerja");
  const hasil = await hapus(sesi.id, id);
  revalidatePath("/admin/unit-kerja");
  return hasil;
}
