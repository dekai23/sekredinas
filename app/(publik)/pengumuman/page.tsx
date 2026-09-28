import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Megaphone } from "lucide-react";

import { Kartu, KartuIsi, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { tanggalPanjang } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pengumuman",
  description:
    "Pengumuman resmi Badan Kepegawaian dan Pengembangan Sumber Daya Manusia " +
    "Kabupaten Yahukimo.",
};

/** Daftar pengumuman yang ditandai untuk ditayangkan di portal publik. */
export default async function HalamanPengumuman() {
  const daftar = await db
    .select({
      id: schema.pengumuman.id,
      judul: schema.pengumuman.judul,
      ringkasan: schema.pengumuman.ringkasan,
      isi: schema.pengumuman.isi,
      kategori: schema.pengumuman.kategori,
      prioritas: schema.pengumuman.prioritas,
      tanggalMulai: schema.pengumuman.tanggalMulai,
    })
    .from(schema.pengumuman)
    .where(eq(schema.pengumuman.publik, true))
    .orderBy(desc(schema.pengumuman.tanggalMulai));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Lencana nada="emas">Informasi</Lencana>
      <h1 className="mt-3 text-3xl font-bold text-navy-800">Pengumuman</h1>
      <p className="mt-2 text-sm text-navy-600">
        Pengumuman resmi instansi yang dapat dilihat masyarakat umum.
      </p>

      <div className="mt-8 space-y-4">
        {daftar.length === 0 ? (
          <Kartu>
            <KeadaanKosong
              judul="Belum ada pengumuman"
              deskripsi="Pengumuman terbaru akan tampil di halaman ini."
              ikon={<Megaphone className="h-8 w-8" aria-hidden />}
            />
          </Kartu>
        ) : (
          daftar.map((p) => (
            <Kartu key={p.id}>
              <KartuIsi>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-navy-800">{p.judul}</h2>
                  <div className="flex gap-1">
                    <Lencana>{p.kategori}</Lencana>
                    {p.prioritas !== "biasa" ? (
                      <Lencana
                        nada={p.prioritas === "segera" ? "perhatian" : "emas"}
                      >
                        {p.prioritas}
                      </Lencana>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-xs text-navy-400">
                  {tanggalPanjang(p.tanggalMulai)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy-700">{p.isi}</p>
              </KartuIsi>
            </Kartu>
          ))
        )}
      </div>
    </div>
  );
}