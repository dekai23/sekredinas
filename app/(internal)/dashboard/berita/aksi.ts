"use server";

import { revalidatePath } from "next/cache";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  buatBerita as buat,
  hapusBerita as hapus,
  ubahBerita as ubah,
} from "@/lib/operasi/berita";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menerbitkan berita/kegiatan (portal publik). */
export async function buatBerita(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/berita");
  if (!boleh(sesi, "berita.kelola")) return { galat: "Anda tidak berwenang menerbitkan berita." };

  const hasil = await buat(sesi.id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/berita");
    revalidatePath("/berita");
    revalidatePath("/galeri");
    revalidatePath("/");
  }
  return hasil;
}

export async function ubahBerita(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/berita");
  if (!boleh(sesi, "berita.kelola")) return { galat: "Anda tidak berwenang mengubah berita." };

  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) {
    revalidatePath("/dashboard/berita");
    revalidatePath("/berita");
    revalidatePath("/galeri");
    revalidatePath("/");
  }
  return hasil;
}

export async function hapusBerita(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/berita");
  if (!boleh(sesi, "berita.kelola")) return { galat: "Anda tidak berwenang menghapus berita." };

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/berita");
  revalidatePath("/berita");
  revalidatePath("/");
  return hasil;
}
