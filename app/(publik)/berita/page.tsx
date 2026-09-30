import type { Metadata } from "next";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { ArrowRight, Newspaper, Search } from "lucide-react";
import Link from "next/link";

import { KepalaHalaman } from "@/components/publik/kepala-halaman";
import { SampulBerita, sampulKategori } from "@/components/publik/sampul";
import { Kartu, KartuIsi, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { Input } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { db, schema } from "@/lib/db";
import { LABEL_KATEGORI_BERITA } from "@/lib/label";
import { tanggalPanjang } from "@/lib/utils";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Berita & Kegiatan",
  description:
    "Berita, artikel, dan kegiatan Badan Kepegawaian dan Pengembangan Sumber Daya " +
    "Manusia Kabupaten Yahukimo.",
};

const UKURAN_HALAMAN = 9;
const KATEGORI = ["berita", "kegiatan", "artikel", "diklat", "prestasi"];

type Props = { searchParams: Promise<{ q?: string; kategori?: string; hal?: string }> };

/** Daftar berita/artikel/kegiatan publik dengan pencarian & filter kategori. */
export default async function HalamanBerita({ searchParams }: Props) {
  const param = await searchParams;
  const halaman = Math.max(1, Number(param.hal ?? "1") || 1);
  const kataKunci = (param.q ?? "").trim();

  const syarat: SQL[] = [eq(schema.berita.publik, true)];
  if (kataKunci) {
    syarat.push(
      or(
        ilike(schema.berita.judul, `%${kataKunci}%`),
        ilike(schema.berita.ringkasan, `%${kataKunci}%`),
        ilike(schema.berita.isi, `%${kataKunci}%`),
      )!,
    );
  }
  if (param.kategori) syarat.push(eq(schema.berita.kategori, param.kategori));
  const kondisi = and(...syarat);

  const [total, daftar] = await Promise.all([
    db.select({ n: count() }).from(schema.berita).where(kondisi),
    db
      .select({
        id: schema.berita.id,
        judul: schema.berita.judul,
        slug: schema.berita.slug,
        ringkasan: schema.berita.ringkasan,
        kategori: schema.berita.kategori,
        gambarUrl: schema.berita.gambarUrl,
        tanggalTerbit: schema.berita.tanggalTerbit,
      })
      .from(schema.berita)
      .where(kondisi)
      .orderBy(desc(schema.berita.tanggalTerbit))
      .limit(UKURAN_HALAMAN)
      .offset((halaman - 1) * UKURAN_HALAMAN),
  ]);

  const jumlah = total[0]?.n ?? 0;
  const totalHalaman = Math.max(1, Math.ceil(jumlah / UKURAN_HALAMAN));
  const naikPertama = halaman === 1 && !kataKunci && !param.kategori;
  const utama = naikPertama ? daftar[0] : undefined;
  const sisanya = naikPertama ? daftar.slice(1) : daftar;

  const tautan = (perubahan: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (kataKunci) p.set("q", kataKunci);
    if (param.kategori) p.set("kategori", param.kategori);
    for (const [k, v] of Object.entries(perubahan)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const qs = p.toString();
    return `/berita${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <KepalaHalaman
        label="Berita"
        judul="Berita & Kegiatan"
        deskripsi="Kabar terbaru, artikel kepegawaian, dan dokumentasi kegiatan BKPSDM Kabupaten Yahukimo."
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Pencarian & kategori */}
        <Kartu>
          <form method="get" className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
                aria-hidden
              />
              <Input name="q" defaultValue={kataKunci} placeholder="Cari berita atau artikel..." className="pl-9" aria-label="Pencarian" />
            </div>
            <div className="flex flex-wrap gap-1">
              <Link href={tautan({ kategori: undefined, hal: undefined })}>
                <Lencana nada={!param.kategori ? "gelap" : "netral"}>Semua</Lencana>
              </Link>
              {KATEGORI.map((k) => (
                <Link key={k} href={tautan({ kategori: k, hal: undefined })}>
                  <Lencana nada={param.kategori === k ? "gelap" : "netral"}>
                    {LABEL_KATEGORI_BERITA[k] ?? k}
                  </Lencana>
                </Link>
              ))}
            </div>
            <Tombol type="submit" varian="garis">
              Cari
            </Tombol>
          </form>
        </Kartu>

        {daftar.length === 0 ? (
          <div className="mt-6">
            <Kartu>
              <KeadaanKosong
                judul="Belum ada berita"
                deskripsi="Berita dan kegiatan terbaru akan tampil di halaman ini."
                ikon={<Newspaper className="h-8 w-8" aria-hidden />}
              />
            </Kartu>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Sorotan utama */}
            {utama ? (
              <Link href={`/berita/${utama.slug}`} className="group block">
                <Kartu className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="grid md:grid-cols-2">
                    <SampulBerita
                      kategori={utama.kategori}
                      judul={utama.judul}
                      gambarUrl={utama.gambarUrl}
                      className="h-56 md:h-full"
                    />
                    <KartuIsi className="flex flex-col justify-center p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Lencana nada="emas">Sorotan</Lencana>
                        <Lencana>{LABEL_KATEGORI_BERITA[utama.kategori] ?? utama.kategori}</Lencana>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-navy-800 group-hover:text-navy-900">
                        {utama.judul}
                      </h2>
                      {utama.ringkasan ? (
                        <p className="mt-2 text-sm leading-relaxed text-navy-600">
                          {utama.ringkasan}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-navy-400">
                        {tanggalPanjang(utama.tanggalTerbit)}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-biru-600">
                        Baca selengkapnya <ArrowRight className="h-4 w-4" aria-hidden />
                      </span>
                    </KartuIsi>
                  </div>
                </Kartu>
              </Link>
            ) : null}

            {/* Grid berita */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sisanya.map((b) => {
                const konfigurasi = sampulKategori(b.kategori);
                return (
                  <Link key={b.id} href={`/berita/${b.slug}`} className="group">
                    <Kartu className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                      <SampulBerita
                        kategori={b.kategori}
                        judul={b.judul}
                        gambarUrl={b.gambarUrl}
                        className="h-44 w-full"
                      />
                      <KartuIsi>
                        <Lencana nada={konfigurasi.label === "Diklat" ? "emas" : "netral"}>
                          {konfigurasi.label}
                        </Lencana>
                        <h3 className="mt-2 font-semibold text-navy-800 group-hover:text-navy-900">
                          {b.judul}
                        </h3>
                        {b.ringkasan ? (
                          <p className="mt-1 line-clamp-3 text-sm text-navy-600">{b.ringkasan}</p>
                        ) : null}
                        <p className="mt-3 text-xs text-navy-400">
                          {tanggalPanjang(b.tanggalTerbit)}
                        </p>
                      </KartuIsi>
                    </Kartu>
                  </Link>
                );
              })}
            </div>

            {/* Paginasi */}
            {totalHalaman > 1 ? (
              <div className="flex items-center justify-between border-t border-navy-100 pt-4">
                <p className="text-sm text-navy-500">
                  Halaman {halaman} dari {totalHalaman} · total {jumlah} tulisan
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
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
