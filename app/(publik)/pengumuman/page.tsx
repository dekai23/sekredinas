import type { Metadata } from "next";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { Megaphone } from "lucide-react";

import { KepalaHalaman } from "@/components/publik/kepala-halaman";
import { Kartu, KartuIsi, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { LABEL_KATEGORI_PENGUMUMAN, LABEL_PRIORITAS } from "@/lib/label";
import { tanggalPanjang } from "@/lib/utils";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Pengumuman",
  description:
    "Pengumuman resmi Badan Kepegawaian dan Pengembangan Sumber Daya Manusia " +
    "Kabupaten Yahukimo.",
};

/** Pengumuman publik yang belum berakhir masa tayangnya. */
export default async function HalamanPengumuman() {
  const awalHari = new Date();
  awalHari.setHours(0, 0, 0, 0);

  const daftar = await db
    .select({
      id: schema.pengumuman.id,
      judul: schema.pengumuman.judul,
      ringkasan: schema.pengumuman.ringkasan,
      isi: schema.pengumuman.isi,
      kategori: schema.pengumuman.kategori,
      prioritas: schema.pengumuman.prioritas,
      tanggalMulai: schema.pengumuman.tanggalMulai,
      tanggalBerakhir: schema.pengumuman.tanggalBerakhir,
    })
    .from(schema.pengumuman)
    .where(
      and(
        eq(schema.pengumuman.publik, true),
        lte(schema.pengumuman.tanggalMulai, new Date()),
        or(isNull(schema.pengumuman.tanggalBerakhir), gte(schema.pengumuman.tanggalBerakhir, awalHari)),
      ),
    )
    .orderBy(desc(schema.pengumuman.tanggalMulai));

  const [utama, ...lainnya] = daftar;

  return (
    <div>
      <KepalaHalaman
        label="Pengumuman"
        judul="Pengumuman"
        deskripsi="Pengumuman resmi instansi yang dapat dilihat masyarakat umum."
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {daftar.length === 0 ? (
          <Kartu>
            <KeadaanKosong
              judul="Belum ada pengumuman"
              deskripsi="Pengumuman terbaru akan tampil di halaman ini."
              ikon={<Megaphone className="h-8 w-8" aria-hidden />}
            />
          </Kartu>
        ) : (
          <div className="space-y-4">
            {utama ? (
              <Kartu className="overflow-hidden border-navy-200">
                <div className="h-1 w-full bg-gradient-to-r from-biru-600 via-biru-400 to-emas-400" />
                <KartuIsi className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Lencana nada="emas">Terbaru</Lencana>
                    <Lencana>{LABEL_KATEGORI_PENGUMUMAN[utama.kategori] ?? utama.kategori}</Lencana>
                    {utama.prioritas !== "biasa" ? (
                      <Lencana nada={LABEL_PRIORITAS[utama.prioritas]?.nada}>
                        {LABEL_PRIORITAS[utama.prioritas]?.label ?? utama.prioritas}
                      </Lencana>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-navy-800">{utama.judul}</h2>
                  <p className="mt-1 text-xs text-navy-400">{tanggalPanjang(utama.tanggalMulai)}</p>
                  {utama.ringkasan ? (
                    <p className="mt-3 text-sm font-medium text-navy-700">{utama.ringkasan}</p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-600">
                    {utama.isi}
                  </p>
                </KartuIsi>
              </Kartu>
            ) : null}

            {lainnya.map((p) => (
              <Kartu key={p.id} className="transition-shadow hover:shadow-md">
                <KartuIsi>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold text-navy-800">{p.judul}</h2>
                    <div className="flex flex-wrap gap-1">
                      <Lencana>{LABEL_KATEGORI_PENGUMUMAN[p.kategori] ?? p.kategori}</Lencana>
                      {p.prioritas !== "biasa" ? (
                        <Lencana nada={LABEL_PRIORITAS[p.prioritas]?.nada}>
                          {LABEL_PRIORITAS[p.prioritas]?.label ?? p.prioritas}
                        </Lencana>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-navy-400">{tanggalPanjang(p.tanggalMulai)}</p>
                  {p.ringkasan ? (
                    <p className="mt-2 text-sm text-navy-600">{p.ringkasan}</p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-700">
                    {p.isi}
                  </p>
                </KartuIsi>
              </Kartu>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
