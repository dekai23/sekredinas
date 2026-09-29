import type { Metadata } from "next";
import { and, desc, eq, ne } from "drizzle-orm";
import { ArrowLeft, CalendarDays, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SampulBerita, sampulKategori } from "@/components/publik/sampul";
import { Kartu, KartuIsi, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { LABEL_KATEGORI_BERITA } from "@/lib/label";
import { tanggalPanjang } from "@/lib/utils";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

async function ambilBerita(slug: string) {
  const baris = await db
    .select({
      id: schema.berita.id,
      judul: schema.berita.judul,
      slug: schema.berita.slug,
      ringkasan: schema.berita.ringkasan,
      isi: schema.berita.isi,
      kategori: schema.berita.kategori,
      gambarUrl: schema.berita.gambarUrl,
      noindex: schema.berita.noindex,
      tanggalTerbit: schema.berita.tanggalTerbit,
      pembuat: schema.pegawai.namaLengkap,
    })
    .from(schema.berita)
    .leftJoin(schema.pegawai, eq(schema.berita.createdBy, schema.pegawai.id))
    .where(and(eq(schema.berita.slug, slug), eq(schema.berita.publik, true)))
    .limit(1);
  return baris[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = await ambilBerita(slug);
  if (!b) return { title: "Berita tidak ditemukan" };
  return {
    title: b.judul,
    description: b.ringkasan ?? undefined,
    robots: b.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: b.judul,
      description: b.ringkasan ?? undefined,
      images: b.gambarUrl && /^https?:\/\//i.test(b.gambarUrl) ? [b.gambarUrl] : undefined,
    },
  };
}

/** Detail berita/artikel/kegiatan + berita terkait. */
export default async function DetailBerita({ params }: Props) {
  const { slug } = await params;
  const b = await ambilBerita(slug);
  if (!b) notFound();

  const terkait = await db
    .select({
      id: schema.berita.id,
      judul: schema.berita.judul,
      slug: schema.berita.slug,
      kategori: schema.berita.kategori,
      gambarUrl: schema.berita.gambarUrl,
      tanggalTerbit: schema.berita.tanggalTerbit,
    })
    .from(schema.berita)
    .where(and(eq(schema.berita.publik, true), ne(schema.berita.id, b.id)))
    .orderBy(desc(schema.berita.tanggalTerbit))
    .limit(3);

  const konfigurasi = sampulKategori(b.kategori);
  const paragraf = b.isi.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div>
      <section className="border-b border-navy-100 bg-navy-50/60">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            href="/berita"
            className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Semua berita
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Lencana nada="emas">{LABEL_KATEGORI_BERITA[b.kategori] ?? b.kategori}</Lencana>
            <span className="inline-flex items-center gap-1 text-xs text-navy-500">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {tanggalPanjang(b.tanggalTerbit)}
            </span>
            {b.pembuat ? (
              <span className="inline-flex items-center gap-1 text-xs text-navy-500">
                <User className="h-3.5 w-3.5" aria-hidden />
                {b.pembuat}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-navy-800">{b.judul}</h1>
          {b.ringkasan ? (
            <p className="mt-3 text-base leading-relaxed text-navy-600">{b.ringkasan}</p>
          ) : null}
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <SampulBerita
          kategori={b.kategori}
          judul={b.judul}
          gambarUrl={b.gambarUrl}
          className="mb-8 h-64 w-full rounded-xl sm:h-80"
        />

        <div className="space-y-4 text-[15px] leading-relaxed text-navy-700">
          {paragraf.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-navy-100 bg-navy-50 px-5 py-4 text-sm text-navy-600">
          Kategori: <strong className="text-navy-800">{konfigurasi.label}</strong>. Ikuti kanal
          resmi {""}
          <Link href="/" className="font-semibold text-teal-700 hover:text-teal-800">
            portal BKPSDM Yahukimo
          </Link>{" "}
          untuk informasi kepegawaian terbaru.
        </div>
      </article>

      {terkait.length > 0 ? (
        <section className="border-t border-navy-100 bg-navy-50/60">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h2 className="mb-4 text-xl font-bold text-navy-800">Berita terkait</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {terkait.map((t) => (
                <Link key={t.id} href={`/berita/${t.slug}`} className="group">
                  <Kartu className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                    <SampulBerita
                      kategori={t.kategori}
                      judul={t.judul}
                      gambarUrl={t.gambarUrl}
                      className="h-40 w-full"
                    />
                    <KartuIsi>
                      <Lencana>{LABEL_KATEGORI_BERITA[t.kategori] ?? t.kategori}</Lencana>
                      <h3 className="mt-2 font-semibold text-navy-800 group-hover:text-navy-900">
                        {t.judul}
                      </h3>
                      <p className="mt-2 text-xs text-navy-400">
                        {tanggalPanjang(t.tanggalTerbit)}
                      </p>
                    </KartuIsi>
                  </Kartu>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
