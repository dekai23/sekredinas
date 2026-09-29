import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Archive, Download, Eye, FileSpreadsheet, FileText, Image as ImageIcon, Plus, Search } from "lucide-react";
import Link from "next/link";

import { TombolHapus } from "@/components/internal/tombol-hapus";
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
import { Input } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { daftarUnitKerja } from "@/lib/data/instansi";
import { db, schema } from "@/lib/db";
import { ukuranBerkas } from "@/lib/label";
import { pecahTag } from "@/lib/operasi/arsip";

import { hapusArsip } from "./aksi";
import { FormArsip } from "./form-arsip";

export const dynamic = "force-dynamic";

const UKURAN_HALAMAN = 20;

const KATEGORI_UMUM = [
  "Surat Keputusan",
  "Surat Edaran",
  "Surat Perjanjian",
  "Laporan",
  "Berita Acara",
  "Data Kepegawaian",
];

type Props = {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    tahun?: string;
    tag?: string;
    hal?: string;
  }>;
};

function ikonBerkas(tipe: string | null) {
  if (tipe?.startsWith("image/")) return ImageIcon;
  if (tipe?.includes("spreadsheet")) return FileSpreadsheet;
  return FileText;
}

/** Arsip digital: unggah multi-format, pencarian kategori/tahun/tag, preview. */
export default async function HalamanArsip({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/arsip");
  const bolehKelola = boleh(sesi, "arsip.kelola");
  const param = await searchParams;
  const halaman = Math.max(1, Number(param.hal ?? "1") || 1);

  const syarat: SQL[] = [];
  const kataKunci = (param.q ?? "").trim();
  if (kataKunci) {
    syarat.push(
      or(
        ilike(schema.arsip.judul, `%${kataKunci}%`),
        ilike(schema.arsip.deskripsi, `%${kataKunci}%`),
        ilike(schema.arsip.tags, `%${kataKunci}%`),
      )!,
    );
  }
  if (param.kategori) syarat.push(eq(schema.arsip.kategori, param.kategori));
  const tahun = param.tahun ? Number(param.tahun) : null;
  if (tahun && Number.isFinite(tahun)) syarat.push(eq(schema.arsip.tahun, tahun));
  if (param.tag) syarat.push(ilike(schema.arsip.tags, `%${param.tag}%`));

  const kondisi = syarat.length > 0 ? and(...syarat) : undefined;

  const [total, daftar, kategoriTersedia, unit] = await Promise.all([
    db.select({ n: count() }).from(schema.arsip).where(kondisi),
    db
      .select({
        id: schema.arsip.id,
        judul: schema.arsip.judul,
        deskripsi: schema.arsip.deskripsi,
        kategori: schema.arsip.kategori,
        tahun: schema.arsip.tahun,
        fileUrl: schema.arsip.fileUrl,
        fileName: schema.arsip.fileName,
        fileSize: schema.arsip.fileSize,
        fileType: schema.arsip.fileType,
        tags: schema.arsip.tags,
        createdAt: schema.arsip.createdAt,
        pembuat: schema.pegawai.namaLengkap,
      })
      .from(schema.arsip)
      .leftJoin(schema.pegawai, eq(schema.arsip.uploadedBy, schema.pegawai.id))
      .where(kondisi)
      .orderBy(desc(schema.arsip.createdAt))
      .limit(UKURAN_HALAMAN)
      .offset((halaman - 1) * UKURAN_HALAMAN),
    db
      .selectDistinct({ kategori: schema.arsip.kategori })
      .from(schema.arsip)
      .orderBy(sql`${schema.arsip.kategori} asc`),
    daftarUnitKerja(),
  ]);

  const jumlah = total[0]?.n ?? 0;
  const totalHalaman = Math.max(1, Math.ceil(jumlah / UKURAN_HALAMAN));

  const tautan = (perubahan: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (kataKunci) p.set("q", kataKunci);
    if (param.kategori) p.set("kategori", param.kategori);
    if (param.tahun) p.set("tahun", param.tahun);
    if (param.tag) p.set("tag", param.tag);
    for (const [k, v] of Object.entries(perubahan)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const qs = p.toString();
    return `/dashboard/arsip${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Arsip Digital</h1>
          <p className="text-sm text-navy-500">
            {jumlah} berkas terarsip. Cari berdasarkan judul, kategori, tahun, atau tag.
          </p>
        </div>
        {bolehKelola ? (
          <Lencana nada="emas">
            <Plus className="h-3 w-3" aria-hidden /> Mode kelola aktif
          </Lencana>
        ) : null}
      </div>

      {/* Penyaring */}
      <Kartu>
        <form method="get" className="grid gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
              aria-hidden
            />
            <Input
              name="q"
              defaultValue={kataKunci}
              placeholder="Cari judul, deskripsi, atau tag..."
              className="pl-9"
              aria-label="Pencarian arsip"
            />
          </div>
          <select
            name="kategori"
            defaultValue={param.kategori ?? ""}
            aria-label="Kategori"
            className="h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200"
          >
            <option value="">Semua kategori</option>
            {kategoriTersedia
              .map((k) => k.kategori)
              .filter((k): k is string => Boolean(k))
              .map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <Input
              type="number"
              name="tahun"
              defaultValue={param.tahun ?? ""}
              placeholder="Tahun"
              min={1900}
              max={2200}
              aria-label="Tahun"
            />
            <Input name="tag" defaultValue={param.tag ?? ""} placeholder="Tag" aria-label="Tag" />
            <Tombol type="submit" varian="garis">
              Cari
            </Tombol>
          </div>
        </form>
      </Kartu>

      {/* Unggah */}
      {bolehKelola ? (
        <Kartu>
          <KartuKepala
            judul="Unggah arsip baru"
            deskripsi="Format PDF, DOCX, XLSX, JPG, atau PNG hingga 25 MB."
          />
          <KartuIsi>
            <FormArsip
              unit={unit.map((u) => ({ id: u.id, nama: u.nama }))}
              kategoriUmum={KATEGORI_UMUM}
              tahunIni={new Date().getFullYear()}
            />
          </KartuIsi>
        </Kartu>
      ) : null}

      {/* Daftar arsip */}
      <Kartu>
        <KartuKepala
          judul="Daftar berkas"
          deskripsi="Klik judul untuk membuka pratinjau berkas."
        />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada arsip"
            deskripsi="Berkas arsip yang diunggah akan tampil di sini."
            ikon={<Archive className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <>
            <TabelPembungkus>
              <TabelKepala>
                <tr>
                  <SelKepala>Judul</SelKepala>
                  <SelKepala>Kategori</SelKepala>
                  <SelKepala>Tahun</SelKepala>
                  <SelKepala>Tag</SelKepala>
                  <SelKepala>Berkas</SelKepala>
                  <SelKepala>Aksi</SelKepala>
                </tr>
              </TabelKepala>
              <tbody>
                {daftar.map((a) => {
                  const Ikon = ikonBerkas(a.fileType);
                  return (
                    <TabelBaris key={a.id}>
                      <Sel className="max-w-[22rem]">
                        <Link
                          href={`/dashboard/arsip/${a.id}`}
                          className="font-semibold text-navy-800 underline-offset-2 hover:underline"
                        >
                          {a.judul}
                        </Link>
                        {a.deskripsi ? (
                          <p className="line-clamp-1 text-xs text-navy-500">{a.deskripsi}</p>
                        ) : null}
                      </Sel>
                      <Sel className="text-sm">{a.kategori ?? "-"}</Sel>
                      <Sel className="font-mono text-xs">{a.tahun ?? "-"}</Sel>
                      <Sel>
                        <div className="flex flex-wrap gap-1">
                          {pecahTag(a.tags)
                            .slice(0, 3)
                            .map((t) => (
                              <Lencana key={t}>{t}</Lencana>
                            ))}
                        </div>
                      </Sel>
                      <Sel>
                        <span className="flex items-center gap-1.5 text-xs text-navy-500">
                          <Ikon className="h-3.5 w-3.5" aria-hidden />
                          {ukuranBerkas(a.fileSize)}
                        </span>
                      </Sel>
                      <Sel>
                        <div className="flex flex-wrap items-center gap-1">
                          <Link
                            href={`/dashboard/arsip/${a.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-50"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            Pratinjau
                          </Link>
                          <a
                            href={`/berkas/${a.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden />
                            Unduh
                          </a>
                          {bolehKelola ? (
                            <TombolHapus
                              aksi={hapusArsip}
                              id={a.id}
                              konfirmasi={`Hapus arsip "${a.judul}"?`}
                            />
                          ) : null}
                        </div>
                      </Sel>
                    </TabelBaris>
                  );
                })}
              </tbody>
            </TabelPembungkus>

            <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm">
              <p className="text-navy-500">
                Halaman {halaman} dari {totalHalaman} · total {jumlah} berkas
              </p>
              <div className="flex gap-2">
                {halaman > 1 ? (
                  <Link href={tautan({ hal: String(halaman - 1) })}>
                    <Tombol varian="garis" ukuran="kecil">
                      Sebelumnya
                    </Tombol>
                  </Link>
                ) : null}
                {halaman < totalHalaman ? (
                  <Link href={tautan({ hal: String(halaman + 1) })}>
                    <Tombol varian="garis" ukuran="kecil">
                      Berikutnya
                    </Tombol>
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </Kartu>
    </div>
  );
}
