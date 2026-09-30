import type { Metadata } from "next";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Images } from "lucide-react";
import Link from "next/link";

import { KepalaHalaman } from "@/components/publik/kepala-halaman";
import { SampulBerita } from "@/components/publik/sampul";
import { Kartu, KartuIsi, KeadaanKosong } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { tanggalPanjang } from "@/lib/utils";

export const revalidate = 180;

export const metadata: Metadata = {
  title: "Galeri Kegiatan",
  description:
    "Dokumentasi kegiatan Badan Kepegawaian dan Pengembangan Sumber Daya Manusia " +
    "Kabupaten Yahukimo.",
};

/** Galeri dokumentasi kegiatan (bersumber dari berita bertanda kegiatan). */
export default async function HalamanGaleri() {
  const daftar = await db
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
    .where(
      and(
        eq(schema.berita.publik, true),
        inArray(schema.berita.kategori, ["kegiatan", "diklat", "prestasi"]),
      ),
    )
    .orderBy(desc(schema.berita.tanggalTerbit));

  return (
    <div>
      <KepalaHalaman
        label="Galeri"
        judul="Galeri Kegiatan"
        deskripsi="Dokumentasi kegiatan, pelatihan, dan momen penting lingkungan BKPSDM Kabupaten Yahukimo."
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {daftar.length === 0 ? (
          <Kartu>
            <KeadaanKosong
              judul="Belum ada dokumentasi"
              deskripsi="Foto dan dokumentasi kegiatan akan tampil di sini."
              ikon={<Images className="h-8 w-8" aria-hidden />}
            />
          </Kartu>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((g) => (
              <Link key={g.id} href={`/berita/${g.slug}`} className="group">
                <Kartu className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                  <SampulBerita
                    kategori={g.kategori}
                    judul={g.judul}
                    gambarUrl={g.gambarUrl}
                    className="h-52 w-full"
                  />
                  <KartuIsi>
                    <h2 className="font-semibold text-navy-800 group-hover:text-navy-900">
                      {g.judul}
                    </h2>
                    <p className="mt-2 text-xs text-navy-400">
                      {tanggalPanjang(g.tanggalTerbit)}
                    </p>
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
