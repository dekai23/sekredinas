/**
 * Route handler untuk menyajikan berkas unggahan.
 *
 * Semua berkas berada di luar `public/`, jadi setiap permintaan harus melewati
 * pemeriksaan sesi di sini. Ini satu-satunya jalan keluar berkas; tidak ada
 * berkas yang dilayani sebagai konten statis.
 *
 * Contoh: GET /berkas/surat-masuk/2026/9/nama-surat-ab12cd34ef56.pdf
 */
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { bacaTokenSesi, NAMA_COOKIE_SESI } from "@/lib/auth/sesi";
import { pathAbsolut } from "@/lib/unggah";

/** Hanya PDF/doc/arsip yang boleh disajikan; jangan pernah menyajikan apa pun. */
const TIPE_TAMPIL: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/** Hindari path traversal: hanya izinkan nama berkas sederhana per segmen. */
function segmentsAman(nama: string): string[] {
  const bagian = nama.split("/").filter(Boolean);
  if (bagian.length === 0) return [];
  return bagian.every((b) => /^[\w.\-]+$/.test(b) && b !== "." && b !== "..")
    ? bagian
    : [];
}

export async function GET(
  permintaan: NextRequest,
  { params }: { params: Promise<{ nama: string[] }> },
) {
  // 1. Wajib punya sesi yang sah (token di-verifikasi, bukan sekadar ada).
  const token = permintaan.cookies.get(NAMA_COOKIE_SESI)?.value;
  const sesi = await bacaTokenSesi(token);
  if (!sesi) {
    return NextResponse.json({ galat: "Tidak terautentikasi." }, { status: 401 });
  }

  const { nama } = await params;
  const bagian = segmentsAman(nama.join("/"));
  if (bagian.length === 0) {
    return NextResponse.json({ galat: "Jalur berkas tidak valid." }, { status: 400 });
  }
  const jalurRelatif = bagian.join("/");

  const ekstensi = extname(jalurRelatif).toLowerCase();
  const tipe = TIPE_TAMPIL[ekstensi];
  if (!tipe) {
    return NextResponse.json({ galat: "Format berkas tidak dapat ditampilkan." }, { status: 415 });
  }

  try {
    const isi = await readFile(pathAbsolut(jalurRelatif));
    return new NextResponse(new Uint8Array(isi), {
      headers: {
        "Content-Type": tipe,
        "Content-Length": String(isi.byteLength),
        // Unggahan milik instansi: jangan pernah disimpan cache perantara.
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${basename(jalurRelatif)}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ galat: "Berkas tidak ditemukan." }, { status: 404 });
  }
}
