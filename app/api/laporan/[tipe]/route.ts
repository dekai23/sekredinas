/**
 * Route handler ekspor laporan (PRD 6.J) dalam format CSV yang dapat dibuka
 * langsung oleh Excel/LibreOffice. Pemeriksaan sesi & izin dilakukan di sini.
 *
 * Contoh: /api/laporan/surat-masuk?dari=2026-01-01&sampai=2026-12-31
 */
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { boleh } from "@/lib/auth/hak-akses";
import { sesiSaatIni } from "@/lib/auth/sesi";
import { db, schema } from "@/lib/db";
import { LABEL_JENIS_CUTI, LABEL_KONDISI_ASET, LABEL_STATUS_SURAT_KELUAR, LABEL_STATUS_SURAT_MASUK } from "@/lib/label";
import { tanggalRingkas, tanggalSedang } from "@/lib/utils";

type Kolom = { judul: string; nilai: (baris: Record<string, unknown>) => unknown };

const TIPE: Record<string, { nama: string; kolom: Kolom[] }> = {
  "surat-masuk": {
    nama: "rekap-surat-masuk",
    kolom: [
      { judul: "Nomor Agenda", nilai: (b) => b.nomorAgenda },
      { judul: "Nomor Surat", nilai: (b) => b.nomorSurat },
      { judul: "Tanggal Surat", nilai: (b) => tanggalSedang(b.tanggalSurat as string) },
      { judul: "Tanggal Terima", nilai: (b) => tanggalSedang(b.tanggalTerima as string) },
      { judul: "Asal Surat", nilai: (b) => b.asalSurat },
      { judul: "Perihal", nilai: (b) => b.perihal },
      { judul: "Sifat", nilai: (b) => b.sifat },
      { judul: "Status", nilai: (b) => LABEL_STATUS_SURAT_MASUK[b.status as string]?.label ?? b.status },
    ],
  },
  "surat-keluar": {
    nama: "rekap-surat-keluar",
    kolom: [
      { judul: "Nomor Surat", nilai: (b) => b.nomorSurat },
      { judul: "Tanggal", nilai: (b) => tanggalSedang(b.tanggalSurat as string) },
      { judul: "Tujuan", nilai: (b) => b.tujuan },
      { judul: "Perihal", nilai: (b) => b.perihal },
      { judul: "Status", nilai: (b) => LABEL_STATUS_SURAT_KELUAR[b.status as string]?.label ?? b.status },
    ],
  },
  cuti: {
    nama: "rekap-cuti",
    kolom: [
      { judul: "Nama", nilai: (b) => b.nama },
      { judul: "NIP", nilai: (b) => b.nip },
      { judul: "Jenis", nilai: (b) => LABEL_JENIS_CUTI[b.jenisCuti as string] ?? b.jenisCuti },
      { judul: "Mulai", nilai: (b) => tanggalSedang(b.tanggalMulai as string) },
      { judul: "Selesai", nilai: (b) => tanggalSedang(b.tanggalSelesai as string) },
      { judul: "Hari", nilai: (b) => b.totalHari },
      { judul: "Status", nilai: (b) => b.status },
    ],
  },
  inventaris: {
    nama: "rekap-inventaris",
    kolom: [
      { judul: "Kode", nilai: (b) => b.kodeAset },
      { judul: "Nama Aset", nilai: (b) => b.namaAset },
      { judul: "Kategori", nilai: (b) => b.kategori },
      { judul: "Jumlah", nilai: (b) => b.jumlah },
      { judul: "Satuan", nilai: (b) => b.satuan },
      { judul: "Kondisi", nilai: (b) => LABEL_KONDISI_ASET[b.kondisi as string]?.label ?? b.kondisi },
      { judul: "Nilai", nilai: (b) => b.nilaiPerolehan },
    ],
  },
  arsip: {
    nama: "rekap-arsip",
    kolom: [
      { judul: "Judul", nilai: (b) => b.judul },
      { judul: "Kategori", nilai: (b) => b.kategori },
      { judul: "Tahun", nilai: (b) => b.tahun },
      { judul: "Tag", nilai: (b) => b.tags },
      { judul: "Berkas", nilai: (b) => b.fileName },
      { judul: "Diunggah", nilai: (b) => tanggalRingkas(b.createdAt as Date) },
    ],
  },
};

/** Membungkus sel agar aman di CSV (kutip ganda + escape). */
function selCsv(nilai: unknown): string {
  if (nilai === null || nilai === undefined) return "";
  const teks = String(nilai).replace(/"/g, '""');
  return /[",;\n]/.test(teks) ? `"${teks}"` : teks;
}

export async function GET(
  permintaan: NextRequest,
  { params }: { params: Promise<{ tipe: string }> },
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !boleh(sesi, "laporan.lihat")) {
    return NextResponse.json({ galat: "Tidak diizinkan." }, { status: 403 });
  }

  const { tipe } = await params;
  const konfigurasi = TIPE[tipe];
  if (!konfigurasi) {
    return NextResponse.json({ galat: "Jenis laporan tidak dikenal." }, { status: 404 });
  }

  const dari = permintaan.nextUrl.searchParams.get("dari");
  const sampai = permintaan.nextUrl.searchParams.get("sampai");

  let baris: Record<string, unknown>[] = [];

  if (tipe === "surat-masuk") {
    const syarat: SQL[] = [];
    if (dari) syarat.push(gte(schema.suratMasuk.tanggalTerima, dari));
    if (sampai) syarat.push(lte(schema.suratMasuk.tanggalTerima, sampai));
    baris = await db
      .select()
      .from(schema.suratMasuk)
      .where(syarat.length ? and(...syarat) : undefined)
      .orderBy(desc(schema.suratMasuk.tanggalTerima));
  } else if (tipe === "surat-keluar") {
    const syarat: SQL[] = [];
    if (dari) syarat.push(gte(schema.suratKeluar.tanggalSurat, dari));
    if (sampai) syarat.push(lte(schema.suratKeluar.tanggalSurat, sampai));
    baris = await db
      .select()
      .from(schema.suratKeluar)
      .where(syarat.length ? and(...syarat) : undefined)
      .orderBy(desc(schema.suratKeluar.tanggalSurat));
  } else if (tipe === "cuti") {
    baris = await db
      .select({
        nama: schema.pegawai.namaLengkap,
        nip: schema.pegawai.nip,
        jenisCuti: schema.cuti.jenisCuti,
        tanggalMulai: schema.cuti.tanggalMulai,
        tanggalSelesai: schema.cuti.tanggalSelesai,
        totalHari: schema.cuti.totalHari,
        status: schema.cuti.status,
      })
      .from(schema.cuti)
      .innerJoin(schema.pegawai, eq(schema.cuti.pegawaiId, schema.pegawai.id))
      .orderBy(desc(schema.cuti.createdAt));
  } else if (tipe === "inventaris") {
    baris = await db.select().from(schema.inventaris).orderBy(asc(schema.inventaris.kodeAset));
  } else if (tipe === "arsip") {
    baris = await db.select().from(schema.arsip).orderBy(desc(schema.arsip.createdAt));
  }

  const kepala = konfigurasi.kolom.map((k) => selCsv(k.judul)).join(";");
  const isi = baris
    .map((b) => konfigurasi.kolom.map((k) => selCsv(k.nilai(b))).join(";"))
    .join("\r\n");

  // BOM UTF-8 agar Excel membaca huruf beraksen dengan benar.
  const csv = `\uFEFF${kepala}\r\n${isi}`;
  const namaBerkas = `${konfigurasi.nama}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
