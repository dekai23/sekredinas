import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

import { Kartu, KartuIsi, KartuKepala, Lencana } from "@/components/ui/dasar";
import { KopSurat } from "@/components/kop/kop-surat";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_STATUS_SURAT_KELUAR, ukuranBerkas } from "@/lib/label";
import { tanggalPanjang, tanggalSedang } from "@/lib/utils";

import { TombolAjukan } from "./tombol-aksi";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tersimpan?: string }>;
};

/** Detail surat keluar + pratinjau naskah pada kop F4 (PRD 6.C). */
export default async function DetailSuratKeluar({ params, searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/surat-keluar");
  const { id } = await params;
  const { tersimpan } = await searchParams;

  const data = await db
    .select({
      surat: schema.suratKeluar,
      unit: schema.unitKerja.nama,
      penandatangan: schema.pegawai.namaLengkap,
      pangkat: schema.pegawai.pangkatGolongan,
      jabatanPenandatangan: schema.pegawai.jabatan,
      eselon: schema.pegawai.eselon,
      pembina: schema.pegawai.namaLengkap,
      pemerika: schema.pegawai.namaLengkap,
    })
    .from(schema.suratKeluar)
    .leftJoin(schema.unitKerja, eq(schema.suratKeluar.unitId, schema.unitKerja.id))
    .leftJoin(schema.pegawai, eq(schema.suratKeluar.penandatanganId, schema.pegawai.id))
    .where(eq(schema.suratKeluar.id, id))
    .limit(1);

  const baris = data[0];
  if (!baris) notFound();

  const meta = LABEL_STATUS_SURAT_KELUAR[baris.surat.status];
  const bolehAjukan = boleh(sesi, "surat-keluar.ubah") && baris.surat.status === "draft";
  const bolehSetujui = boleh(sesi, "surat-keluar.setujui") && baris.surat.status === "diajukan";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/surat-keluar"
            className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke daftar
          </Link>
          <h1 className="mt-1 font-mono text-xl font-bold text-navy-800">
            {baris.surat.nomorSurat ?? "Belum bernomor"}
          </h1>
          <p className="text-sm text-navy-500">{baris.surat.tujuan}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Lencana nada={meta?.nada}>{meta?.label ?? baris.surat.status}</Lencana>
          {baris.surat.terkunci ? (
            <Lencana nada="gelap">
              <Lock className="h-3 w-3" aria-hidden />
              Terkunci
            </Lencana>
          ) : null}
        </div>
      </div>

      {tersimpan ? (
        <Kartu className="border-emerald-200 bg-emerald-50">
          <KartuIsi className="text-sm text-emerald-800">
            Draf tersimpan. Ajukan surat untuk memperoleh nomor dan meminta persetujuan.
          </KartuIsi>
        </Kartu>
      ) : null}

      {baris.surat.catatanPersetujuan ? (
        <Kartu className="border-amber-200 bg-amber-50">
          <KartuIsi className="text-sm text-amber-900">
            <p className="font-semibold">Catatan penandatangan</p>
            <p>{baris.surat.catatanPersetujuan}</p>
          </KartuIsi>
        </Kartu>
      ) : null}

      <Kartu>
        <KartuKepala judul="Informasi surat" />
        <KartuIsi className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-navy-500">Tanggal: </span>
            {tanggalPanjang(baris.surat.tanggalSurat)}
          </p>
          <p>
            <span className="text-navy-500">Unit penerbit: </span>
            {baris.unit ?? "-"}
          </p>
          <p>
            <span className="text-navy-500">Penandatangan: </span>
            {baris.penandatangan ?? "-"}
          </p>
          <p>
            <span className="text-navy-500">Perihal: </span>
            {baris.surat.perihal}
          </p>
          {baris.surat.fileUrl ? (
            <p className="sm:col-span-2">
              <span className="text-navy-500">Lampiran: </span>
              {baris.surat.fileName} ({ukuranBerkas(baris.surat.fileSize)})
            </p>
          ) : null}
        </KartuIsi>
      </Kartu>

      {/* Pratinjau naskah: ukuran F4 dengan kop resmi. */}
      <Kartu>
        <KartuKepala
          judul="Pratinjau naskah"
          deskripsi="Tampilan sesuai kertas F4 yang akan dicetak."
        />
        <KartuIsi>
          <div className="cetak-halaman mx-auto w-full max-w-[21.6cm] bg-white p-6 shadow-sm ring-1 ring-navy-100">
            <KopSurat />
            <div className="mt-6 space-y-4 font-serif text-[12pt] leading-relaxed text-black">
              <div>
                <p>
                  Nomor : {baris.surat.nomorSurat ?? "(belum ada)"}
                </p>
                <p>Lampiran : 1 (satu) berkas</p>
                <p>Perihal : {baris.surat.perihal}</p>
              </div>

              <div>
                <p>Yth.</p>
                <p className="pl-8">{baris.surat.tujuan}</p>
                <p className="mt-4">di</p>
                <p className="pl-8">Tempat</p>
              </div>

              <p className="whitespace-pre-wrap">{baris.surat.isiSurat}</p>

              {baris.surat.parafUntuk ? (
                <div className="mt-6 text-[10pt]">
                  <p>Paraf:</p>
                  <p className="pl-8">{baris.surat.parafUntuk}</p>
                </div>
              ) : null}

              {/* Blok tanda tangan, rata kanan seperti surat dinas. */}
              <div className="mt-8 text-right">
                <p>{tanggalSedang(baris.surat.tanggalSurat)}</p>
                <p className="mt-1">BADAN KEPEGAWAIAN DAN PENGEMBANGAN</p>
                <p>SUMBER DAYA MANUSIA</p>
                <p className="mt-1 font-bold">{baris.jabatanPenandatangan ?? "Penandatangan"}</p>
                <p className="mt-12 underline">
                  {baris.penandatangan ?? "................................"}
                </p>
                {baris.pangkat ? <p className="mt-0.5">NIP. {baris.pangkat}</p> : null}
              </div>
            </div>
          </div>
        </KartuIsi>
      </Kartu>

      {bolehAjukan || bolehSetujui ? (
        <Kartu>
          <KartuKepala judul="Tindakan" />
          <KartuIsi>
            <TombolAjukan
              id={baris.surat.id}
              bolehAjukan={bolehAjukan}
              bolehSetujui={bolehSetujui}
            />
          </KartuIsi>
        </Kartu>
      ) : null}
    </div>
  );
}


