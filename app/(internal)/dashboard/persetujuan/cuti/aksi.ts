"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { setujuiCuti as setujui, tolakCuti as tolak } from "@/lib/operasi/cuti";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menyetujui pengajuan cuti (PRD 6.G). */
export async function setujuiCuti(id: string, catatan: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/persetujuan/cuti");
  if (!boleh(sesi, "cuti.kelola")) return { galat: "Anda tidak berwenang menyetujui cuti." };

  const hasil = await setujui(sesi.id, id, catatan);
  revalidatePath("/dashboard/persetujuan/cuti");
  revalidatePath("/dashboard/cuti");
  return hasil;
}

/** Server action: menolak pengajuan cuti. */
export async function tolakCuti(id: string, catatan: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/persetujuan/cuti");
  if (!boleh(sesi, "cuti.kelola")) return { galat: "Anda tidak berwenang menolak cuti." };

  const hasil = await tolak(sesi.id, id, catatan);
  revalidatePath("/dashboard/persetujuan/cuti");
  revalidatePath("/dashboard/cuti");
  return hasil;
}
