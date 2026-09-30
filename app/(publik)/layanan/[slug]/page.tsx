import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ArrowLeft, Clock, FileCheck2, ListChecks, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Kartu, KartuIsi, KartuKepala, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

function bacaDaftar(nilai: string | null): string[] {
  if (!nilai) return [];
  try {
    const hasil = JSON.parse(nilai);
    return Array.isArray(hasil) ? hasil.map(String) : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baris = await db
    .select({ judul: schema.layanan.judul, ringkasan: schema.layanan.ringkasan })
    .from(schema.layanan)
    .where(eq(schema.layanan.slug, slug))
    .limit(1);
  const l = baris[0];
  return {
    title: l?.judul ?? "Layanan",
    description: l?.ringkasan ?? "Informasi layanan kepegawaian BKPSDM Kabupaten Yahukimo.",
  };
}

/** Detail satu layanan kepegawaian (syarat & alur). */
export default async function DetailLayanan({ params }: Props) {
  const { slug } = await params;
  const baris = await db
    .select({
      id: schema.layanan.id,
      judul: schema.layanan.judul,
      ringkasan: schema.layanan.ringkasan,
      deskripsi: schema.layanan.deskripsi,
      syarat: schema.layanan.syarat,
      alur: schema.layanan.alur,
      waktuPenyelesaian: schema.layanan.waktuPenyelesaian,
      dasarHukum: schema.layanan.dasarHukum,
      unit: schema.unitKerja.nama,
    })
    .from(schema.layanan)
    .leftJoin(schema.unitKerja, eq(schema.layanan.unitId, schema.unitKerja.id))
    .where(eq(schema.layanan.slug, slug))
    .limit(1);

  const l = baris[0];
  if (!l) notFound();

  const syarat = bacaDaftar(l.syarat);
  const alur = bacaDaftar(l.alur);

  return (
    <div>
      <section className="border-b border-biru-100 bg-biru-50/50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/layanan"
            className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke layanan
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Lencana nada="emas">Layanan</Lencana>
            {l.waktuPenyelesaian ? (
              <Lencana nada="teal">
                <Clock className="h-3 w-3" aria-hidden />
                {l.waktuPenyelesaian}
              </Lencana>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-navy-800">{l.judul}</h1>
          {l.ringkasan ? <p className="mt-2 max-w-2xl text-sm text-navy-600">{l.ringkasan}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <Kartu>
          <KartuKepala judul="Deskripsi layanan" />
          <KartuIsi>
            <p className="text-sm leading-relaxed text-navy-700">{l.deskripsi}</p>
          </KartuIsi>
        </Kartu>

        <div className="grid gap-6 md:grid-cols-2">
          <Kartu>
            <KartuKepala
              judul="Syarat berkas"
              aksi={<FileCheck2 className="h-4 w-4 text-navy-400" aria-hidden />}
            />
            <KartuIsi>
              {syarat.length === 0 ? (
                <p className="text-sm text-navy-500">Belum ada informasi syarat.</p>
              ) : (
                <ul className="space-y-2">
                  {syarat.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-navy-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emas-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </KartuIsi>
          </Kartu>

          <Kartu>
            <KartuKepala
              judul="Alur pengajuan"
              aksi={<ListChecks className="h-4 w-4 text-navy-400" aria-hidden />}
            />
            <KartuIsi>
              {alur.length === 0 ? (
                <p className="text-sm text-navy-500">Belum ada informasi alur.</p>
              ) : (
                <ol className="space-y-3">
                  {alur.map((a, i) => (
                    <li key={a} className="flex items-start gap-3 text-sm text-navy-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-biru-600 font-mono text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      {a}
                    </li>
                  ))}
                </ol>
              )}
            </KartuIsi>
          </Kartu>
        </div>

        <Kartu>
          <KartuIsi className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-navy-500">
            {l.unit ? <span>Unit pengelola: {l.unit}</span> : null}
            {l.dasarHukum ? (
              <span className="flex items-center gap-1">
                <Scale className="h-3.5 w-3.5" aria-hidden />
                Dasar hukum: {l.dasarHukum}
              </span>
            ) : null}
          </KartuIsi>
        </Kartu>
      </section>
    </div>
  );
}
