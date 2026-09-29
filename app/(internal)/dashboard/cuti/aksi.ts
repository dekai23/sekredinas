"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { ajukanCuti as ajukan } from "@/lib/operasi/cuti";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: mengajukan cuti (PRD 6.G). */
export async function ajukanCuti(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/cuti");
  if (!boleh(sesi, "cuti.buat")) return { galat: "Anda tidak berwenang mengajukan cuti." };

  const hasil = await ajukan(sesi.id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/cuti");
    revalidatePath("/dashboard/persetujuan/cuti");
  }
  return hasil;
}
