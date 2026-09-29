import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Eye, EyeOff, Newspaper, Pencil, Plus, Search } from "lucide-react";
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
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_KATEGORI_BERITA } from "@/lib/label";
import { formatWaktuLokal } from "@/lib/utils";
import { kategoriBerita } from "@/lib/validasi/konten";

import { hapusBerita } from "./aksi";
import { FormBerita } from "./form-berita";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; kategori?: string }> };

/** Kelola berita/artikel/kegiatan portal publik (admin). */
export default async function HalamanBeritaInternal({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/berita");
  if (!boleh(sesi, "berita.kelola")) {
    return (
      <Kartu>
        <KartuIsi className="text-sm text-navy-600">Anda tidak berwenang mengelola berita.</KartuIsi>
      </Kartu>
    );
  }

  const param = await searchParams;
  const kataKunci = (param.q ?? "").trim();
  const syarat: SQL[] = [];
  if (kataKunci) {
    syarat.push(
      or(ilike(schema.berita.judul, `%${kataKunci}%`), ilike(schema.berita.ringkasan, `%${kataKunci}%`))!,
    );
  }
  if (param.kategori) syarat.push(eq(schema.berita.kategori, param.kategori));
  const kondisi = syarat.length > 0 ? and(...syarat) : undefined;

  const daftar = await db
    .select({
      id: schema.berita.id,
      judul: schema.berita.judul,
      slug: schema.berita.slug,
      ringkasan: schema.berita.ringkasan,
      isi: schema.berita.isi,
      kategori: schema.berita.kategori,
      gambarUrl: schema.berita.gambarUrl,
      publik: schema.berita.publik,
      noindex: schema.berita.noindex,
      tanggalTerbit: schema.berita.tanggalTerbit,
      pembuat: schema.pegawai.namaLengkap,
    })
    .from(schema.berita)
    .leftJoin(schema.pegawai, eq(schema.berita.createdBy, schema.pegawai.id))
    .where(kondisi)
    .orderBy(desc(schema.berita.tanggalTerbit));

  const filter = (nilai?: string) =>
    `/dashboard/berita${nilai ? `?${nilai}` : ""}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Berita &amp; Kegiatan</h1>
          <p className="text-sm text-navy-500">
            {daftar.length} tulisan. Yang bertanda publik tayang di portal `/berita`.
          </p>
        </div>
      </div>

      {/* Pencarian */}
      <Kartu>
        <form method="get" className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
            <Input name="q" defaultValue={kataKunci} placeholder="Cari judul atau ringkasan..." className="pl-9" aria-label="Pencarian" />
          </div>
          <div className="flex flex-wrap gap-1">
            <Link href={filter()}>
              <Lencana nada={!param.kategori ? "gelap" : "netral"}>Semua</Lencana>
            </Link>
            {kategoriBerita.map((k) => (
              <Link key={k} href={filter(`kategori=${k}`)}>
                <Lencana nada={param.kategori === k ? "gelap" : "netral"}>
                  {LABEL_KATEGORI_BERITA[k]}
                </Lencana>
              </Link>
            ))}
          </div>
          <button type="submit" className="h-10 rounded-lg border border-navy-200 bg-white px-4 text-sm font-semibold text-navy-700 hover:bg-navy-50">
            Cari
          </button>
        </form>
      </Kartu>

      {/* Terbitkan */}
      <Kartu>
        <KartuKepala
          judul="Tulis berita / artikel / kegiatan"
          aksi={
            <Lencana nada="emas">
              <Plus className="h-3 w-3" aria-hidden /> Baru
            </Lencana>
          }
        />
        <KartuIsi>
          <FormBerita />
        </KartuIsi>
      </Kartu>

      {/* Daftar */}
      <Kartu>
        <KartuKepala judul="Daftar tulisan" />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada tulisan"
            deskripsi="Berita yang diterbitkan akan tampil di sini."
            ikon={<Newspaper className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Judul</SelKepala>
                <SelKepala>Kategori</SelKepala>
                <SelKepala>Tanggal</SelKepala>
                <SelKepala>Status</SelKepala>
                <SelKepala>Aksi</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((b) => (
                <TabelBaris key={b.id}>
                  <Sel className="max-w-[24rem]">
                    <p className="font-semibold text-navy-800">{b.judul}</p>
                    <p className="truncate font-mono text-xs text-navy-400">/{b.slug}</p>
                    {b.pembuat ? <p className="text-xs text-navy-400">oleh {b.pembuat}</p> : null}
                  </Sel>
                  <Sel>
                    <Lencana>{LABEL_KATEGORI_BERITA[b.kategori] ?? b.kategori}</Lencana>
                  </Sel>
                  <Sel className="whitespace-nowrap text-xs">
                    {formatWaktuLokal(b.tanggalTerbit).slice(0, 10)}
                  </Sel>
                  <Sel>
                    <Lencana nada={b.publik ? "sukses" : "netral"}>
                      {b.publik ? (
                        <>
                          <Eye className="h-3 w-3" aria-hidden /> Publik
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" aria-hidden /> Draf
                        </>
                      )}
                    </Lencana>
                  </Sel>
                  <Sel>
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                        <Pencil className="h-3 w-3" aria-hidden /> Ubah
                      </summary>
                      <div className="mt-2 w-[min(80vw,600px)] rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
                        <FormBerita
                          dataAwal={{
                            id: b.id,
                            judul: b.judul,
                            slug: b.slug,
                            ringkasan: b.ringkasan ?? "",
                            isi: b.isi,
                            kategori: b.kategori,
                            gambarUrl: b.gambarUrl ?? "",
                            publik: b.publik,
                            noindex: b.noindex,
                            tanggalTerbit: formatWaktuLokal(b.tanggalTerbit).slice(0, 10),
                          }}
                        />
                        <div className="pt-2">
                          <TombolHapus aksi={hapusBerita} id={b.id} konfirmasi={`Hapus tulisan "${b.judul}"?`} />
                        </div>
                      </div>
                    </details>
                  </Sel>
                </TabelBaris>
              ))}
            </tbody>
          </TabelPembungkus>
        )}
      </Kartu>
    </div>
  );
}
