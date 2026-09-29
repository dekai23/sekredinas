"use server";

import { revalidatePath } from "next/cache";

import { wajibRole } from "@/lib/auth/hak-akses";
import {
  buatKategori as buat,
  hapusKategori as hapus,
  ubahKategori as ubah,
} from "@/lib/operasi/master";
import type { HasilForm } from "@/lib/validasi/konten";

export async function buatKategori(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/kategori-surat");
  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) revalidatePath("/admin/kategori-surat");
  return hasil;
}

export async function ubahKategori(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/kategori-surat");
  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) revalidatePath("/admin/kategori-surat");
  return hasil;
}

export async function hapusKategori(id: string): Promise<HasilForm> {
  const sesi = await wajibRole(["admin"], "admin/kategori-surat");
  const hasil = await hapus(sesi.id, id);
  revalidatePath("/admin/kategori-surat");
  return hasil;
}
