import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";

import {
  Kartu,
  KartuIsi,
  KartuKepala,
  KeadaanKosong,
  Lencana,
  Sel,
  SelKepala,
  TabelBaris,
  TabelKepala,
  TabelPembungkus,
} from "@/components/ui/dasar";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import {
  LABEL_SIFAT,
  LABEL_STATUS_DISPOSISI,
  LABEL_STATUS_SURAT_MASUK,
  ukuranBerkas,
} from "@/lib/label";
import { tanggalPanjang, tanggalRingkas, tanggalSql } from "@/lib/utils";

import { bolehLihatRahasia } from "@/lib/queries/surat-masuk";
import { FormDisposisi } from "./form-disposisi";
import { TombolUbahStatus } from "./tombol-status";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ terdaftar?: string }>;
};

/** Detail surat masuk: data, scan, dan riwayat disposisi berantai (PRD 6.B & 6.D). */
export default async function DetailSuratMasuk({ params, searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/surat-masuk");
  const { id } = await params;
  const { terdaftar } = await searchParams;

  const surat = await db
    .select()
    .from(schema.suratMasuk)
    .where(eq(schema.suratMasuk.id, id))
    .limit(1);

  const baris = surat[0];
  if (!baris) notFound();

  // Surat "rahasia" hanya boleh dibuka admin & pimpinan (PRD 6.B).
  if (!bolehLihatRahasia(sesi, baris.sifat)) {
    return (
      <div className="mx-auto max-w-xl">
        <Kartu className="border-red-200">
          <KartuIsi className="text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden />
            <h1 className="mt-2 text-lg font-bold text-navy-800">Akses dibatasi</h1>
            <p className="mt-1 text-sm text-navy-600">
              Surat ini bersifat rahasia dan hanya dapat dibuka oleh Admin dan Pimpinan.
            </p>
            <Link href="/dashboard/surat-masuk" className="mt-4 inline-block">
              <Lencana nada="bahaya">Kembali ke daftar</Lencana>
            </Link>
          </KartuIsi>
        </Kartu>
      </div>
    );
  }

  // Riwayat disposisi: dua alias agar pengirim & penerima dapat ditampilkan.
  const pengirim = alias(schema.pegawai, "pengirim_disposisi");
  const penerima = alias(schema.pegawai, "penerima_disposisi");

  const [kategori, pembuat, disposisi] = await Promise.all([
    baris.kategoriId
      ? db
          .select({ nama: schema.kategoriSurat.nama })
          .from(schema.kategoriSurat)
          .where(eq(schema.kategoriSurat.id, baris.kategoriId))
          .limit(1)
      : Promise.resolve([{ nama: null }]),
    db
      .select({ nama: schema.pegawai.namaLengkap })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.id, baris.createdBy))
      .limit(1),
    db
      .select({
        id: schema.disposisi.id,
        keUserId: schema.disposisi.keUserId,
        instruksi: schema.disposisi.instruksi,
        catatan: schema.disposisi.catatan,
        status: schema.disposisi.status,
        batasWaktu: schema.disposisi.batasWaktu,
        level: schema.disposisi.level,
        dibacaPada: schema.disposisi.dibacaPada,
        selesaiPada: schema.disposisi.selesaiPada,
        namaPengirim: pengirim.namaLengkap,
        namaPenerima: penerima.namaLengkap,
      })
      .from(schema.disposisi)
      .innerJoin(pengirim, eq(schema.disposisi.dariUserId, pengirim.id))
      .innerJoin(penerima, eq(schema.disposisi.keUserId, penerima.id))
      .where(eq(schema.disposisi.suratMasukId, id))
      .orderBy(asc(schema.disposisi.level), asc(schema.disposisi.createdAt)),
  ]);

  // Kandidat penerima: seluruh pegawai aktif.
  const daftarPenerima = await db
    .select({
      id: schema.pegawai.id,
      nama: schema.pegawai.namaLengkap,
      unit: schema.unitKerja.nama,
    })
    .from(schema.pegawai)
    .leftJoin(schema.unitKerja, eq(schema.pegawai.unitId, schema.unitKerja.id))
    .where(eq(schema.pegawai.aktif, true))
    .orderBy(asc(schema.pegawai.namaLengkap));

  // Disposisi yang masih berjalan dipakai untuk penerusan (membentuk rantai).
  const disposisiAktif = disposisi
    .filter((d) => d.status !== "selesai")
    .map((d) => ({
      id: d.id,
      level: d.level,
      namaPenerima: d.namaPenerima,
      keUserId: d.keUserId,
    }));

  const status = LABEL_STATUS_SURAT_MASUK[baris.status];
  const sifat = LABEL_SIFAT[baris.sifat];
  const hariIni = tanggalSql(new Date());
  const bolehDisposisi = boleh(sesi, "disposisi.buat");
  const bolehUbah = boleh(sesi, "surat-masuk.ubah");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/surat-masuk"
            className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke daftar
          </Link>
          <h1 className="mt-1 font-mono text-xl font-bold text-navy-800">{baris.nomorAgenda}</h1>
          <p className="text-sm text-navy-500">
            {baris.asalSurat}
            {baris.nomorSurat ? ` - No. ${baris.nomorSurat}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Lencana nada={sifat?.nada}>{sifat?.label ?? baris.sifat}</Lencana>
          <Lencana nada={status?.nada}>{status?.label ?? baris.status}</Lencana>
        </div>
      </div>

      {terdaftar ? (
        <Kartu className="border-emerald-200 bg-emerald-50">
          <KartuIsi className="text-sm text-emerald-800">
            Surat berhasil terdaftar dengan nomor agenda <strong>{terdaftar}</strong>.
          </KartuIsi>
        </Kartu>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Kartu className="lg:col-span-2">
          <KartuKepala judul="Detail surat" />
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala className="w-44">Keterangan</SelKepala>
                <SelKepala>Isi</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Asal surat</Sel>
                <Sel>{baris.asalSurat}</Sel>
              </TabelBaris>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Nomor surat</Sel>
                <Sel className="font-mono text-xs">{baris.nomorSurat ?? "-"}</Sel>
              </TabelBaris>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Perihal</Sel>
                <Sel>{baris.perihal}</Sel>
              </TabelBaris>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Tanggal surat</Sel>
                <Sel>{tanggalPanjang(baris.tanggalSurat)}</Sel>
              </TabelBaris>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Tanggal diterima</Sel>
                <Sel>{tanggalPanjang(baris.tanggalTerima)}</Sel>
              </TabelBaris>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Kategori</Sel>
                <Sel>{kategori[0]?.nama ?? "Belum ditentukan"}</Sel>
              </TabelBaris>
              <TabelBaris>
                <Sel className="text-xs font-semibold text-navy-500">Didaftarkan oleh</Sel>
                <Sel>
                  {pembuat[0]?.nama ?? "-"}
                  <span className="text-xs text-navy-400"> - {tanggalRingkas(baris.createdAt)}</span>
                </Sel>
              </TabelBaris>
              {baris.catatan ? (
                <TabelBaris>
                  <Sel className="text-xs font-semibold text-navy-500">Catatan internal</Sel>
                  <Sel>{baris.catatan}</Sel>
                </TabelBaris>
              ) : null}
            </tbody>
          </TabelPembungkus>
        </Kartu>

        <Kartu>
          <KartuKepala judul="Berkas scan" />
          <KartuIsi>
            {baris.fileUrl ? (
              <>
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 shrink-0 text-navy-500" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-800">{baris.fileName}</p>
                    <p className="text-xs text-navy-500">PDF - {ukuranBerkas(baris.fileSize)}</p>
                  </div>
                </div>
                <a
                  href={`/berkas/${baris.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-9 items-center rounded-lg border border-navy-200 px-3 text-sm font-semibold text-navy-700 hover:bg-navy-50"
                >
                  Buka / unduh PDF
                </a>
              </>
            ) : (
              <p className="text-sm text-navy-500">Belum ada berkas scan.</p>
            )}
          </KartuIsi>
        </Kartu>
      </div>

      {/* Riwayat disposisi berantai (PRD 6.D). */}
      <Kartu>
        <KartuKepala
          judul="Riwayat disposisi"
          deskripsi="Disposisi berantai: level 1 diberikan pimpinan, level berikutnya adalah penerusan."
        />
        {disposisi.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada disposisi"
            deskripsi="Surat ini belum didisposisikan kepada siapa pun."
          />
        ) : (
          <ul className="divide-y divide-navy-50">
            {disposisi.map((d) => {
              const meta = LABEL_STATUS_DISPOSISI[d.status];
              const batas = d.batasWaktu ?? hariIni;
              const terlambat = batas < hariIni && d.status === "menunggu";
              return (
                <li key={d.id} className="cetak-putus px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy-400">
                        Level {d.level} - {d.namaPengirim} ke {d.namaPenerima}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-navy-800">{d.instruksi}</p>
                      {d.catatan ? (
                        <p className="mt-0.5 text-sm text-navy-600">{d.catatan}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <Lencana nada={meta?.nada}>{meta?.label ?? d.status}</Lencana>
                      {terlambat ? <Lencana nada="bahaya">Terlambat</Lencana> : null}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-navy-500">
                    Batas waktu: {tanggalPanjang(batas)}
                    {d.dibacaPada ? ` - dibaca ${tanggalRingkas(d.dibacaPada)}` : ""}
                    {d.selesaiPada ? ` - selesai ${tanggalRingkas(d.selesaiPada)}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {bolehDisposisi ? (
          <div className="border-t border-navy-100 px-5 py-4">
            <h3 className="mb-3 text-sm font-bold text-navy-800">Tambah disposisi</h3>
            <FormDisposisi
              suratMasukId={baris.id}
              daftarPenerima={daftarPenerima}
              disposisiAktif={disposisiAktif}
              idPengguna={sesi.id}
            />
          </div>
        ) : null}

        {bolehUbah && baris.status !== "arsip" ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-navy-100 px-5 py-3 text-sm">
            <span className="text-navy-500">Ubah status menjadi:</span>
            {(["dibaca", "selesai", "arsip"] as const).map((s) => (
              <TombolUbahStatus key={s} id={baris.id} status={s} label={LABEL_STATUS_SURAT_MASUK[s].label} />
            ))}
          </div>
        ) : null}
      </Kartu>
    </div>
  );
}

