import { and, asc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { Kartu, KartuIsi, KartuKepala } from "@/components/ui/dasar";
import { PERAN_PIMPINAN, boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { tanggalSql } from "@/lib/utils";

import { FormSuratKeluar } from "./form-surat-keluar";

export const dynamic = "force-dynamic";

/** Halaman penyusunan surat keluar baru (PRD 6.C). */
export default async function HalamanSuratKeluarBaru() {
  const sesi = await wajibMasuk("dashboard/surat-keluar/baru");
  if (!boleh(sesi, "surat-keluar.buat")) {
    redirect("/dashboard/surat-keluar?galat=tidak-berwenang");
  }

  const [kategori, unit, penandatangan] = await Promise.all([
    db
      .select({ id: schema.kategoriSurat.id, nama: schema.kategoriSurat.nama, kode: schema.kategoriSurat.kode })
      .from(schema.kategoriSurat)
      .where(eq(schema.kategoriSurat.aktif, true))
      .orderBy(asc(schema.kategoriSurat.nama)),
    db
      .select({ id: schema.unitKerja.id, nama: schema.unitKerja.nama, kode: schema.unitKerja.kode })
      .from(schema.unitKerja)
      .orderBy(asc(schema.unitKerja.urutan)),
    db
      .select({
        id: schema.pegawai.id,
        nama: schema.pegawai.namaLengkap,
        jabatan: schema.pegawai.jabatan,
      })
      .from(schema.pegawai)
      .where(
        and(eq(schema.pegawai.aktif, true), inArray(schema.pegawai.peran, [...PERAN_PIMPINAN])),
      )
      .orderBy(asc(schema.pegawai.namaLengkap)),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Susun Surat Keluar</h1>
        <p className="text-sm text-navy-500">
          Nomor surat diberikan otomatis setelah draf diajukan untuk persetujuan, dengan
          format KODE/URUT/KODE_UNIT/BULAN/TAHUN.
        </p>
      </div>

      <Kartu>
        <KartuKepala judul="Naskah surat" deskripsi="Lengkapi isian, lalu simpan sebagai draf." />
        <KartuIsi>
          <FormSuratKeluar
            kategori={kategori}
            unit={unit}
            penandatangan={penandatangan.map((p) => ({ ...p, jabatan: p.jabatan ?? "-" }))}
            hariIni={tanggalSql(new Date())}
          />
        </KartuIsi>
      </Kartu>
    </div>
  );
}

