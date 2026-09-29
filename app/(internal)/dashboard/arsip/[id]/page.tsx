import { eq } from "drizzle-orm";
import { ArrowLeft, Download, FileSpreadsheet, FileText, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Kartu, KartuIsi, KartuKepala, Lencana } from "@/components/ui/dasar";
import { wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { ukuranBerkas } from "@/lib/label";
import { pecahTag } from "@/lib/operasi/arsip";
import { tanggalPanjang } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Pratinjau satu berkas arsip (PDF/tautan internal, gambar inline). */
export default async function DetailArsip({ params }: Props) {
  await wajibMasuk("dashboard/arsip");
  const { id } = await params;

  const baris = await db
    .select({
      id: schema.arsip.id,
      judul: schema.arsip.judul,
      deskripsi: schema.arsip.deskripsi,
      kategori: schema.arsip.kategori,
      kodeKlasifikasi: schema.arsip.kodeKlasifikasi,
      tahun: schema.arsip.tahun,
      fileUrl: schema.arsip.fileUrl,
      fileName: schema.arsip.fileName,
      fileSize: schema.arsip.fileSize,
      fileType: schema.arsip.fileType,
      tags: schema.arsip.tags,
      createdAt: schema.arsip.createdAt,
      pembuat: schema.pegawai.namaLengkap,
      unit: schema.unitKerja.nama,
    })
    .from(schema.arsip)
    .leftJoin(schema.pegawai, eq(schema.arsip.uploadedBy, schema.pegawai.id))
    .leftJoin(schema.unitKerja, eq(schema.arsip.unitId, schema.unitKerja.id))
    .where(eq(schema.arsip.id, id))
    .limit(1);

  const a = baris[0];
  if (!a) notFound();

  const adalahPdf = a.fileType === "application/pdf";
  const adalahGambar = a.fileType?.startsWith("image/");
  const tautanBerkas = `/berkas/${a.fileUrl}`;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard/arsip"
          className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kembali ke arsip
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy-800">{a.judul}</h1>
            <p className="text-sm text-navy-500">
              {a.kategori ?? "Tanpa kategori"}
              {a.tahun ? ` · ${a.tahun}` : ""}
              {a.kodeKlasifikasi ? ` · Klasifikasi ${a.kodeKlasifikasi}` : ""}
            </p>
          </div>
          <a
            href={tautanBerkas}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy-700 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <Download className="h-4 w-4" aria-hidden />
            Buka / unduh
          </a>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Kartu className="lg:col-span-2">
          <KartuKepala judul="Pratinjau berkas" />
          <KartuIsi>
            {adalahPdf ? (
              <iframe
                src={tautanBerkas}
                title={a.fileName}
                className="h-[70vh] w-full rounded-lg border border-navy-100"
              />
            ) : adalahGambar ? (
              <img
                src={tautanBerkas}
                alt={a.fileName}
                className="mx-auto max-h-[70vh] rounded-lg border border-navy-100 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-navy-200 bg-navy-50 px-6 py-16 text-center">
                {a.fileType?.includes("spreadsheet") ? (
                  <FileSpreadsheet className="h-10 w-10 text-navy-400" aria-hidden />
                ) : (
                  <FileText className="h-10 w-10 text-navy-400" aria-hidden />
                )}
                <p className="text-sm text-navy-600">
                  Berkas <span className="font-semibold">{a.fileName}</span> tidak dapat
                  dipratinjau langsung di peramban. Silakan unduh untuk membukanya.
                </p>
                <a
                  href={tautanBerkas}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 text-sm font-semibold text-navy-700 hover:bg-navy-50"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Unduh berkas
                </a>
              </div>
            )}
          </KartuIsi>
        </Kartu>

        <Kartu>
          <KartuKepala judul="Metadata" />
          <KartuIsi className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-navy-500">Berkas</p>
              <p className="flex items-center gap-1.5 text-navy-800">
                {adalahGambar ? (
                  <ImageIcon className="h-4 w-4 text-navy-400" aria-hidden />
                ) : (
                  <FileText className="h-4 w-4 text-navy-400" aria-hidden />
                )}
                <span className="truncate">{a.fileName}</span>
              </p>
              <p className="text-xs text-navy-500">{ukuranBerkas(a.fileSize)}</p>
            </div>
            {a.deskripsi ? (
              <div>
                <p className="text-xs font-semibold text-navy-500">Deskripsi</p>
                <p className="text-navy-700">{a.deskripsi}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-navy-500">Unit kerja</p>
              <p className="text-navy-700">{a.unit ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-500">Tag</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {pecahTag(a.tags).length > 0 ? (
                  pecahTag(a.tags).map((t) => <Lencana key={t}>{t}</Lencana>)
                ) : (
                  <span className="text-navy-500">-</span>
                )}
              </div>
            </div>
            <div className="border-t border-navy-50 pt-3">
              <p className="text-xs text-navy-500">
                Diunggah oleh {a.pembuat ?? "-"} · {tanggalPanjang(a.createdAt)}
              </p>
            </div>
          </KartuIsi>
        </Kartu>
      </div>
    </div>
  );
}
