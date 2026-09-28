import { asc, count, desc, eq } from "drizzle-orm";
import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import { KopSurat } from "@/components/kop/kop-surat";
import { Kartu, KartuIsi, Lencana } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";
import { db, schema } from "@/lib/db";
import { identitasInstansi } from "@/lib/data/instansi";
import { tanggalPanjang, tanggalRingkas } from "@/lib/utils";

export const revalidate = 300;

/**
 * Beranda portal publik.
 *
 * Hanya membaca kolom yang memang aman ditampilkan (docs/ARSITEKTUR.md):
 * jumlah pegawai agregat, agenda, dan pengumuman yang ditandai publik.
 * Tidak ada NIP, jabatan, atau dokumen internal yang dikirim ke halaman ini.
 */
export default async function Beranda() {
  const instansi = await identitasInstansi();

  const [jumlahPegawai, jumlahUnit, layanan, pengumuman, agenda] = await Promise.all([
    db.select({ n: count() }).from(schema.pegawai).where(eq(schema.pegawai.aktif, true)),
    db
      .select({ n: count() })
      .from(schema.unitKerja)
      .where(eq(schema.unitKerja.publik, true)),
    db
      .select({
        id: schema.layanan.id,
        judul: schema.layanan.judul,
        slug: schema.layanan.slug,
        ringkasan: schema.layanan.ringkasan,
        waktuPenyelesaian: schema.layanan.waktuPenyelesaian,
      })
      .from(schema.layanan)
      .where(eq(schema.layanan.publik, true))
      .orderBy(asc(schema.layanan.urutan))
      .limit(4),
    db
      .select({
        id: schema.pengumuman.id,
        judul: schema.pengumuman.judul,
        ringkasan: schema.pengumuman.ringkasan,
        tanggalMulai: schema.pengumuman.tanggalMulai,
        kategori: schema.pengumuman.kategori,
      })
      .from(schema.pengumuman)
      .where(eq(schema.pengumuman.publik, true))
      .orderBy(desc(schema.pengumuman.tanggalMulai))
      .limit(3),
    db
      .select({
        id: schema.agenda.id,
        judul: schema.agenda.judul,
        mulai: schema.agenda.mulai,
        lokasi: schema.agenda.lokasi,
      })
      .from(schema.agenda)
      .where(eq(schema.agenda.publik, true))
      .orderBy(asc(schema.agenda.mulai))
      .limit(3),
  ]);

  const ringkasan = [
    { label: "Pegawai", nilai: jumlahPegawai[0]?.n ?? 0 },
    { label: "Unit kerja", nilai: jumlahUnit[0]?.n ?? 0 },
    { label: "Layanan informasi", nilai: layanan.length },
  ];

  return (
    <div>
      {/* Hero: kop resmi instansi. */}
      <section className="border-b border-navy-100 bg-navy-50/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <KopSurat />
          <div className="mt-8 max-w-2xl">
            <Lencana nada="emas">Pelayanan Kepegawaian</Lencana>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-navy-800 sm:text-4xl">
              Informasi dan Layanan Kepegawaian Kabupaten Yahukimo
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              Portal resmi {instansi.namaSingkat} yang menyediakan informasi layanan
              kepegawaian, pengumuman, dan kegiatan publik di Kabupaten Yahukimo.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/layanan">
                <Tombol>Lihat layanan</Tombol>
              </Link>
              <Link href="/profil">
                <Tombol varian="garis">Profil instansi</Tombol>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {/* Angka agregat. */}
        <div className="grid gap-4 sm:grid-cols-3">
          {ringkasan.map((r) => (
            <Kartu key={r.label}>
              <KartuIsi>
                <p className="font-mono text-3xl font-bold text-navy-800">{r.nilai}</p>
                <p className="text-sm text-navy-500">{r.label}</p>
              </KartuIsi>
            </Kartu>
          ))}
        </div>

        {/* Layanan. */}
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-navy-800">Layanan kepegawaian</h2>
              <p className="text-sm text-navy-500">
                Syarat dan alur kenaikan pangkat, pensiun, cuti, dan diklat.
              </p>
            </div>
            <Link
              href="/layanan"
              className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800"
            >
              Semua layanan <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {layanan.map((l) => (
              <Kartu key={l.id} className="transition-shadow hover:shadow-md">
                <KartuIsi>
                  <h3 className="font-semibold text-navy-800">{l.judul}</h3>
                  {l.ringkasan ? <p className="mt-1 text-sm text-navy-600">{l.ringkasan}</p> : null}
                  {l.waktuPenyelesaian ? (
                    <p className="mt-2 text-xs text-navy-500">
                      Perkiraan waktu: {l.waktuPenyelesaian}
                    </p>
                  ) : null}
                  <Link
                    href={`/layanan/${l.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Selengkapnya <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </KartuIsi>
              </Kartu>
            ))}
          </div>
        </div>

        {/* Pengumuman & agenda. */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-bold text-navy-800">Pengumuman</h2>
            {pengumuman.length === 0 ? (
              <Kartu>
                <KartuIsi className="text-sm text-navy-500">Belum ada pengumuman.</KartuIsi>
              </Kartu>
            ) : (
              <ul className="space-y-3">
                {pengumuman.map((p) => (
                  <li key={p.id}>
                    <Kartu>
                      <KartuIsi>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-navy-800">{p.judul}</h3>
                          <Lencana>{p.kategori}</Lencana>
                        </div>
                        {p.ringkasan ? (
                          <p className="mt-1 text-sm text-navy-600">{p.ringkasan}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-navy-400">
                          {tanggalRingkas(p.tanggalMulai)}
                        </p>
                      </KartuIsi>
                    </Kartu>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-navy-800">Agenda kegiatan</h2>
            {agenda.length === 0 ? (
              <Kartu>
                <KartuIsi className="text-sm text-navy-500">Belum ada agenda publik.</KartuIsi>
              </Kartu>
            ) : (
              <ul className="space-y-3">
                {agenda.map((a) => (
                  <li key={a.id}>
                    <Kartu>
                      <KartuIsi className="flex items-start gap-3">
                        <CalendarDays
                          className="mt-0.5 h-5 w-5 shrink-0 text-navy-400"
                          aria-hidden
                        />
                        <div>
                          <h3 className="font-semibold text-navy-800">{a.judul}</h3>
                          <p className="text-sm text-navy-500">
                            {tanggalPanjang(a.mulai)}
                            {a.lokasi ? ` · ${a.lokasi}` : ""}
                          </p>
                        </div>
                      </KartuIsi>
                    </Kartu>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
