import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { NAMA_COOKIE_SESI } from "@/lib/auth/sesi";

/**
 * Penjaga zona internal (menggantikan middleware.ts pada Next.js 16).
 *
 * Perannya hanya memeriksa keberadaan cookie sesi sebelum permintaan mencapai
 * server component. Pemeriksaan yang sesungguhnya (validasi token, role admin)
 * tetap dilakukan oleh `wajibMasuk()` dan `wajibRole()` di lib/auth/hak-akses.ts,
 * sehingga penjaga di sini bukan satu-satunya pertahanan.
 */
export function proxy(permintaan: NextRequest) {
  const { pathname, search } = permintaan.nextUrl;

  // Sudah punya sesi? biarkan lewat; validasi penuh dilakukan di server.
  const adaSesi = Boolean(permintaan.cookies.get(NAMA_COOKIE_SESI)?.value);
  if (adaSesi) return NextResponse.next();

  // Pengalihan ke halaman masuk, mempertahankan tujuan agar dapat diulang.
  const tujuan = new URL("/masuk", permintaan.url);
  tujuan.searchParams.set("lanjut", `${pathname}${search}`);

  const respons = NextResponse.redirect(tujuan);
  // Jangan simpan halaman tujuan di cache browser bersama redirect.
  respons.headers.set("Cache-Control", "no-store");
  return respons;
}

export const config = {
  /**
   * Hanya area internal. Area publik (/, /profil, /layanan, dst.) tetap terbuka
   * agar dapat diindeks mesin pencari.
   */
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
