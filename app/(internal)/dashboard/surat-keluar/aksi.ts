"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  ajukanPersetujuan as ajukan,
  buatSuratKeluar as buat,
  kembalikanSurat as kembalikan,
  setujuiSurat as setujui,
  type HasilBuatSuratKeluar,
} from "@/lib/operasi/surat-keluar";
import type { HasilForm } from "@/lib/validasi/surat";

/** Server action: membuat draf surat keluar (PRD 6.C). */
export async function buatSuratKeluar(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/surat-keluar");
  if (!boleh(sesi, "surat-keluar.buat")) {
    return { galat: "Anda tidak berwenang membuat surat keluar." };
  }

  const hasil = await buat(sesi.id, form);
  if (!hasil.id) return hasil;

  revalidatePath("/dashboard/surat-keluar");
  redirect(`/dashboard/surat-keluar/${hasil.id}?tersimpan=draf`);
}

/** Server action: mengajukan surat keluar agar diberi nomor & disetujui. */
export async function ajukanPersetujuan(_id: string): Promise<HasilBuatSuratKeluar> {
  const sesi = await wajibMasuk("dashboard/surat-keluar");
  const hasil = await ajukan(sesi.id, _id);
  revalidatePath(`/dashboard/surat-keluar/${_id}`);
  revalidatePath("/dashboard/surat-keluar");
  return hasil;
}

/** Server action: menyetujui surat keluar (menjadi immutable). */
export async function setujuiSurat(
  _id: string,
  catatan: string,
): Promise<HasilBuatSuratKeluar> {
  const sesi = await wajibMasuk("dashboard/persetujuan/surat");
  if (!boleh(sesi, "surat-keluar.setujui")) {
    return { galat: "Anda tidak berwenang menyetujui surat keluar." };
  }
  const hasil = await setujui(sesi.id, _id, catatan);
  revalidatePath(`/dashboard/surat-keluar/${_id}`);
  revalidatePath("/dashboard/persetujuan/surat");
  return hasil;
}

/** Server action: mengembalikan surat kepada pembuat. */
export async function kembalikanSurat(
  _id: string,
  catatan: string,
): Promise<HasilBuatSuratKeluar> {
  const sesi = await wajibMasuk("dashboard/persetujuan/surat");
  if (!boleh(sesi, "surat-keluar.setujui")) {
    return { galat: "Anda tidak berwenang mengembalikan surat." };
  }
  const hasil = await kembalikan(sesi.id, _id, catatan);
  revalidatePath(`/dashboard/surat-keluar/${_id}`);
  revalidatePath("/dashboard/persetujuan/surat");
  return hasil;
}
