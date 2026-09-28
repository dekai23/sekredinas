"use server";

import { redirect } from "next/navigation";

import { hapusCookieSesi } from "@/lib/auth/sesi";

/** Server action: keluar dari aplikasi. */
export async function keluar(): Promise<void> {
  await hapusCookieSesi();
  redirect("/masuk?sudah=Anda+berhasil+keluar");
}
