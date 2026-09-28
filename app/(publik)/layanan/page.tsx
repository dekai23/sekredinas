import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, Clock, FileText } from "lucide-react";
import Link from "next/link";

import { Kartu, KartuIsi, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Layanan Kepegawaian",
  description:
    "Syarat dan alur pengajuan kenaikan pangkat, pensiun, cuti tahunan, dan diklat " +
    "di Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo.",
};

/** Membaca daftar syarat/alur yang disimpan sebagai JSON. */
function bacaDaftar(nilai: string | null): string[] {
  if (!nilai) return [];
  try {
    const hasil = JSON.parse(nilai);
    return Array.isArray(hasil) ? hasil.map(String) : [];
  } catch {
    return [];
  }
}

/** Halaman daftar layanan kepegawaian untuk masyarakat. */
export default async function HalamanLayanan() {
  const daftar = await db
    .select({
      id: schema.layanan.id,
      judul: schema.layanan.judul,
      slug: schema.layanan.slug,
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
    .where(eq(schema.layanan.publik, true))
    .orderBy(asc(schema.layanan.urutan));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Lencana nada="emas">Layanan</Lencana>
      <h1 className="mt-3 text-3xl font-bold text-navy-800">Layanan Kepegawaian</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-600">
        Informasi syarat, alur, dan perkiraan waktu penyelesaian pengajuan. Pengajuan
        dilakukan secara langsung di kantor Bagian Kepegawaian.
      </p>

      <div className="mt-8 space-y-4">
        {daftar.length === 0 ? (
          <Kartu>
            <KeadaanKosong
              judul="Belum ada layanan"
              deskripsi="Informasi layanan akan ditambahkan oleh admin sistem."
              ikon={<FileText className="h-8 w-8" aria-hidden />}
            />
          </Kartu>
        ) : (
          daftar.map((l) => {
            const syarat = bacaDaftar(l.syarat);
            const alur = bacaDaftar(l.alur);
            return (
              <Kartu key={l.id}>
                <KartuIsi>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-navy-800">{l.judul}</h2>
                      {l.ringkasan ? (
                        <p className="mt-1 text-sm text-navy-600">{l.ringkasan}</p>
                      ) : null}
                    </div>
                    {l.waktuPenyelesaian ? (
                      <Lencana nada="teal">
                        <Clock className="h-3 w-3" aria-hidden />
                        {l.waktuPenyelesaian}
                      </Lencana>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-navy-700">{l.deskripsi}</p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {syarat.length > 0 ? (
                      <div className="rounded-lg bg-navy-50 p-4">
                        <h3 className="text-sm font-bold text-navy-800">Syarat berkas</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-700">
                          {syarat.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {alur.length > 0 ? (
                      <div className="rounded-lg bg-teal-50 p-4">
                        <h3 className="text-sm font-bold text-navy-800">Alur pengajuan</h3>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-navy-700">
                          {alur.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-navy-500">
                    {l.unit ? <span>Unit pengelola: {l.unit}</span> : null}
                    {l.dasarHukum ? <span>Dasar hukum: {l.dasarHukum}</span> : null}
                  </div>
                </KartuIsi>
              </Kartu>
            );
          })
        )}
      </div>

      <Kartu className="mt-8 border-emas-200 bg-emas-50">
        <KartuIsi className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy-800">
            Butuh penjelasan lebih lanjut? Datang ke Bagian Kepegawaian pada jam layanan.
          </p>
          <Link
            href="/kontak"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emas-700 hover:text-emas-600"
          >
            Halaman kontak <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </KartuIsi>
      </Kartu>
    </div>
  );
}