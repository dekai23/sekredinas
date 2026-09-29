import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  FileText,
  Images,
  MapPin,
  Megaphone,
  Users,
} from "lucide-react";
import Link from "next/link";

import { HeroCarousel, type SlideBerita } from "@/components/publik/hero-carousel";
import { AbstrakAparatur, OrnamenAparatur, PolaGrid } from "@/components/publik/ilustrasi";
import { SampulBerita } from "@/components/publik/sampul";
import { Kartu, KartuIsi, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { identitasInstansi } from "@/lib/data/instansi";
import { LABEL_KATEGORI_BERITA } from "@/lib/label";
import { tanggalPanjang, tanggalRingkas } from "@/lib/utils";

export const revalidate = 120;

/**
 * Beranda portal publik bergaya situs pemerintahan: carousel kegiatan,
 * berita/artikel, agenda, pengumuman, dan galeri. Hanya kolom publik yang
 * dibaca (docs/ARSITEKTUR.md).
 */
export default async function Beranda() {
  const instansi = await identitasInstansi();

  const [
    jumlahPegawai,
    jumlahUnit,
    jumlahBerita,
    layanan,
    pengumuman,
    agenda,
    berita,
    galeri,
    kaban,
  ] = await Promise.all([
    db.select({ n: count() }).from(schema.pegawai).where(eq(schema.pegawai.aktif, true)),
    db.select({ n: count() }).from(schema.unitKerja).where(eq(schema.unitKerja.publik, true)),
    db.select({ n: count() }).from(schema.berita).where(eq(schema.berita.publik, true)),
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
      .limit(6),
    db
      .select({
        id: schema.pengumuman.id,
        judul: schema.pengumuman.judul,
        ringkasan: schema.pengumuman.ringkasan,
        tanggalMulai: schema.pengumuman.tanggalMulai,
        prioritas: schema.pengumuman.prioritas,
      })
      .from(schema.pengumuman)
      .where(eq(schema.pengumuman.publik, true))
      .orderBy(desc(schema.pengumuman.tanggalMulai))
      .limit(4),
    db
      .select({
        id: schema.agenda.id,
        judul: schema.agenda.judul,
        mulai: schema.agenda.mulai,
        lokasi: schema.agenda.lokasi,
        jenis: schema.agenda.jenis,
      })
      .from(schema.agenda)
      .where(and(eq(schema.agenda.publik, true), gte(schema.agenda.mulai, new Date())))
      .orderBy(asc(schema.agenda.mulai))
      .limit(4),
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
      .where(eq(schema.berita.publik, true))
      .orderBy(desc(schema.berita.tanggalTerbit))
      .limit(6),
    db
      .select({
        id: schema.berita.id,
        judul: schema.berita.judul,
        slug: schema.berita.slug,
        kategori: schema.berita.kategori,
        gambarUrl: schema.berita.gambarUrl,
      })
      .from(schema.berita)
      .where(
        and(
          eq(schema.berita.publik, true),
          inArray(schema.berita.kategori, ["kegiatan", "diklat", "prestasi"]),
        ),
      )
      .orderBy(desc(schema.berita.tanggalTerbit))
      .limit(8),
    db
      .select({ nama: schema.pegawai.namaLengkap, jabatan: schema.pegawai.jabatan })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.peran, "kepala_badan"))
      .limit(1),
  ]);

  const slides: SlideBerita[] = berita.slice(0, 4).map((b) => ({
    id: b.id,
    judul: b.judul,
    ringkasan: b.ringkasan,
    slug: b.slug,
    kategori: b.kategori,
    gambarUrl: b.gambarUrl,
    tanggalTerbit: b.tanggalTerbit.toISOString(),
  }));

  const ringkasan = [
    { label: "Pegawai aktif", nilai: jumlahPegawai[0]?.n ?? 0, ikon: Users },
    { label: "Unit kerja", nilai: jumlahUnit[0]?.n ?? 0, ikon: BadgeCheck },
    { label: "Layanan informasi", nilai: layanan.length, ikon: FileText },
    { label: "Berita & kegiatan", nilai: jumlahBerita[0]?.n ?? 0, ikon: Images },
  ];

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-800 to-teal-700 text-white">
        <PolaGrid className="text-white/30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emas-200 ring-1 ring-white/20">
              Portal Resmi Kepegawaian
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
              {(() => {
                const teks = instansi.berandaJudul;
                const idx = teks.toLowerCase().indexOf("yahukimo");
                if (idx === -1) return teks;
                return (
                  <>
                    {teks.slice(0, idx)}
                    <span className="text-emas-400">{teks.slice(idx, idx + 8)}</span>
                    {teks.slice(idx + 8)}
                  </>
                );
              })()}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-navy-100 sm:text-base">
              {instansi.berandaSubjudul}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/berita"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emas-500 px-5 text-sm font-bold text-navy-950 shadow-lg transition-colors hover:bg-emas-400"
              >
                Berita terbaru
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/layanan"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/30 bg-white/5 px-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                Layanan kepegawaian
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">
            <AbstrakAparatur className="relative drop-shadow-2xl" />
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-navy-950/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-white/10 px-4 sm:grid-cols-4 sm:divide-x sm:px-6">
            {ringkasan.map((r) => {
              const Ikon = r.ikon;
              return (
                <div key={r.label} className="flex items-center gap-3 px-2 py-4">
                  <span className="rounded-lg bg-white/10 p-2 text-emas-300">
                    <Ikon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-mono text-xl font-bold text-white sm:text-2xl">{r.nilai}</p>
                    <p className="text-[11px] text-navy-200">{r.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- CAROUSEL KEGIATAN ---------------- */}
      {slides.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <Lencana nada="emas">Sorotan</Lencana>
              <h2 className="mt-2 text-2xl font-bold text-navy-800">Kegiatan &amp; kabar terbaru</h2>
            </div>
            <Link
              href="/berita"
              className="hidden items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800 sm:inline-flex"
            >
              Semua berita <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <HeroCarousel slides={slides} />
        </section>
      ) : null}

      {/* ---------------- LAYANAN CEPAT ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Lencana nada="emas">Layanan</Lencana>
            <h2 className="mt-2 text-2xl font-bold text-navy-800">Layanan kepegawaian</h2>
            <p className="mt-1 max-w-2xl text-sm text-navy-500">
              Syarat, alur, dan perkiraan waktu pengajuan layanan ASN.
            </p>
          </div>
          <Link
            href="/layanan"
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800"
          >
            Semua layanan <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {layanan.map((l) => (
            <Link key={l.id} href={`/layanan/${l.slug}`} className="group">
              <Kartu className="h-full transition-all duration-200 group-hover:-translate-y-1 group-hover:border-emas-300 group-hover:shadow-md">
                <KartuIsi>
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold text-navy-800 group-hover:text-navy-900">{l.judul}</h3>
                  {l.ringkasan ? (
                    <p className="mt-1 line-clamp-3 text-sm text-navy-600">{l.ringkasan}</p>
                  ) : null}
                  {l.waktuPenyelesaian ? (
                    <p className="mt-3 text-xs font-medium text-teal-600">
                      Perkiraan: {l.waktuPenyelesaian}
                    </p>
                  ) : null}
                </KartuIsi>
              </Kartu>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- SAMBUTAN KEPALA DINAS ---------------- */}
      <section className="border-y border-navy-100 bg-navy-50/60">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[auto_1fr]">
          <Kartu className="w-full max-w-xs overflow-hidden">
            <div className="bg-gradient-to-br from-navy-800 to-teal-700 p-6">
              {instansi.berandaSambutanFoto &&
              /^https?:\/\//i.test(instansi.berandaSambutanFoto) ? (
                <img
                  src={instansi.berandaSambutanFoto}
                  alt={instansi.berandaSambutanNama || "Kepala BKPSDM"}
                  className="mx-auto h-40 w-40 rounded-full object-cover ring-4 ring-white/20"
                />
              ) : (
                <OrnamenAparatur className="mx-auto w-32" />
              )}
            </div>
            <KartuIsi className="text-center">
              <p className="font-bold text-navy-800">
                {instansi.berandaSambutanNama || kaban[0]?.nama || "Kepala BKPSDM"}
              </p>
              <p className="text-xs text-navy-500">
                {instansi.berandaSambutanJabatan ||
                  kaban[0]?.jabatan ||
                  "Kepala Badan Kepegawaian dan Pengembangan SDM"}
              </p>
            </KartuIsi>
          </Kartu>
          <div>
            <Lencana nada="emas">Sambutan Kepala Badan</Lencana>
            <h2 className="mt-3 text-2xl font-bold text-navy-800">
              {instansi.berandaSambutanJudul}
            </h2>
            {instansi.berandaSambutanIsi
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-navy-600">
                  {p}
                </p>
              ))}
          </div>
        </div>
      </section>

      {/* ---------------- BERITA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Lencana nada="emas">Berita</Lencana>
            <h2 className="mt-2 text-2xl font-bold text-navy-800">Berita, artikel &amp; kegiatan</h2>
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800"
          >
            Lihat semua <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {berita.length === 0 ? (
          <Kartu>
            <KartuIsi className="text-sm text-navy-500">
              Belum ada berita dipublikasikan.
            </KartuIsi>
          </Kartu>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {berita.slice(0, 6).map((b) => (
              <Link key={b.id} href={`/berita/${b.slug}`} className="group">
                <Kartu className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                  <SampulBerita
                    kategori={b.kategori}
                    judul={b.judul}
                    gambarUrl={b.gambarUrl}
                    className="h-44 w-full"
                  />
                  <KartuIsi>
                    <Lencana>{LABEL_KATEGORI_BERITA[b.kategori] ?? b.kategori}</Lencana>
                    <h3 className="mt-2 font-semibold text-navy-800 group-hover:text-navy-900">
                      {b.judul}
                    </h3>
                    {b.ringkasan ? (
                      <p className="mt-1 line-clamp-3 text-sm text-navy-600">{b.ringkasan}</p>
                    ) : null}
                    <p className="mt-3 text-xs text-navy-400">{tanggalRingkas(b.tanggalTerbit)}</p>
                  </KartuIsi>
                </Kartu>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- AGENDA & PENGUMUMAN ---------------- */}
      <section className="border-y border-navy-100 bg-navy-50/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy-800">
                <CalendarDays className="h-5 w-5 text-teal-500" aria-hidden />
                Agenda kegiatan
              </h2>
              <Link href="/agenda" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                Kalender
              </Link>
            </div>
            {agenda.length === 0 ? (
              <Kartu>
                <KartuIsi className="text-sm text-navy-500">Belum ada agenda publik.</KartuIsi>
              </Kartu>
            ) : (
              <ul className="space-y-3">
                {agenda.map((a) => (
                  <li key={a.id}>
                    <Kartu className="transition-shadow hover:shadow-md">
                      <KartuIsi className="flex items-start gap-3">
                        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-700 text-white">
                          <span className="font-mono text-lg font-bold leading-none">
                            {new Date(a.mulai).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              timeZone: "Asia/Jayapura",
                            })}
                          </span>
                          <span className="text-[10px] uppercase">
                            {new Date(a.mulai).toLocaleDateString("id-ID", {
                              month: "short",
                              timeZone: "Asia/Jayapura",
                            })}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-navy-800">{a.judul}</h3>
                          <p className="text-sm text-navy-500">{tanggalPanjang(a.mulai)}</p>
                          {a.lokasi ? (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
                              <MapPin className="h-3 w-3" aria-hidden />
                              {a.lokasi}
                            </p>
                          ) : null}
                        </div>
                      </KartuIsi>
                    </Kartu>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy-800">
                <Megaphone className="h-5 w-5 text-emas-500" aria-hidden />
                Pengumuman
              </h2>
              <Link href="/pengumuman" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                Semua
              </Link>
            </div>
            {pengumuman.length === 0 ? (
              <Kartu>
                <KartuIsi className="text-sm text-navy-500">Belum ada pengumuman publik.</KartuIsi>
              </Kartu>
            ) : (
              <ul className="space-y-3">
                {pengumuman.map((p) => (
                  <li key={p.id}>
                    <Kartu className="transition-shadow hover:shadow-md">
                      <KartuIsi>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-navy-800">{p.judul}</h3>
                          {p.prioritas !== "biasa" ? (
                            <Lencana nada={p.prioritas === "segera" ? "bahaya" : "emas"}>
                              {p.prioritas}
                            </Lencana>
                          ) : null}
                        </div>
                        {p.ringkasan ? (
                          <p className="mt-1 line-clamp-2 text-sm text-navy-600">{p.ringkasan}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-navy-400">{tanggalRingkas(p.tanggalMulai)}</p>
                      </KartuIsi>
                    </Kartu>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- GALERI ---------------- */}
      {galeri.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Lencana nada="emas">Galeri</Lencana>
              <h2 className="mt-2 text-2xl font-bold text-navy-800">Dokumentasi kegiatan</h2>
            </div>
            <Link
              href="/galeri"
              className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800"
            >
              Buka galeri <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {galeri.map((g) => (
              <Link key={g.id} href={`/berita/${g.slug}`} className="group">
                <div className="overflow-hidden rounded-xl border border-navy-100">
                  <SampulBerita
                    kategori={g.kategori}
                    judul={g.judul}
                    gambarUrl={g.gambarUrl}
                    className="h-32 w-full transition-transform duration-300 group-hover:scale-105 sm:h-40"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium text-navy-700 group-hover:text-navy-900">
                  {g.judul}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 px-6 py-10 text-white sm:px-10">
          <PolaGrid className="text-white/30" />
          <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold">Butuh layanan kepegawaian?</h2>
              <p className="mt-2 max-w-xl text-sm text-navy-100">
                Kunjungi kantor {instansi.namaSingkat} pada jam layanan, atau hubungi kami
                melalui halaman kontak untuk informasi lebih lanjut.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/kontak"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-emas-500 px-4 text-sm font-bold text-navy-950 hover:bg-emas-400"
                >
                  Hubungi kami
                </Link>
                <Link
                  href="/profil"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Profil instansi
                </Link>
              </div>
            </div>
            <OrnamenAparatur className="hidden w-40 sm:block" />
          </div>
        </div>
      </section>
    </div>
  );
}
