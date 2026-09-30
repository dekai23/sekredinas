import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, Clock, FileText } from "lucide-react";
import Link from "next/link";

import { KepalaHalaman } from "@/components/publik/kepala-halaman";
import { Kartu, KartuIsi, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Layanan Kepegawaian",
  description:
    "Syarat dan alur pengajuan kenaikan pangkat, pensiun, cuti tahunan, dan diklat " +
    "di Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo.",
};

/** Halaman daftar layanan kepegawaian untuk masyarakat. */
export default async function HalamanLayanan() {
  const daftar = await db
    .select({
      id: schema.layanan.id,
      judul: schema.layanan.judul,
      slug: schema.layanan.slug,
      ringkasan: schema.layanan.ringkasan,
      waktuPenyelesaian: schema.layanan.waktuPenyelesaian,
      unit: schema.unitKerja.nama,
    })
    .from(schema.layanan)
    .leftJoin(schema.unitKerja, eq(schema.layanan.unitId, schema.unitKerja.id))
    .where(eq(schema.layanan.publik, true))
    .orderBy(asc(schema.layanan.urutan));

  return (
    <div>
      <KepalaHalaman
        label="Layanan"
        judul="Layanan Kepegawaian"
        deskripsi="Informasi syarat, alur, dan perkiraan waktu penyelesaian pengajuan. Pengajuan dilakukan langsung di kantor Bagian Kepegawaian."
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {daftar.length === 0 ? (
          <Kartu>
            <KeadaanKosong
              judul="Belum ada layanan"
              deskripsi="Informasi layanan akan ditambahkan oleh admin sistem."
              ikon={<FileText className="h-8 w-8" aria-hidden />}
            />
          </Kartu>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((l) => (
              <Link key={l.id} href={`/layanan/${l.slug}`} className="group">
                <Kartu className="flex h-full flex-col transition-all duration-200 group-hover:-translate-y-1 group-hover:border-biru-300 group-hover:shadow-md">
                  <KartuIsi className="flex flex-1 flex-col">
                    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-biru-50 text-biru-600">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 className="font-semibold text-navy-800">{l.judul}</h2>
                    {l.ringkasan ? (
                      <p className="mt-1 line-clamp-3 flex-1 text-sm text-navy-600">{l.ringkasan}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {l.waktuPenyelesaian ? (
                        <Lencana nada="teal">
                          <Clock className="h-3 w-3" aria-hidden />
                          {l.waktuPenyelesaian}
                        </Lencana>
                      ) : null}
                      {l.unit ? <Lencana>{l.unit}</Lencana> : null}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-biru-600 group-hover:text-biru-700">
                      Selengkapnya <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </KartuIsi>
                </Kartu>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
