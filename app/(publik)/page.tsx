import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Images,
  MapPin,
  Megaphone,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BannerPromo } from "@/components/publik/banner-promo";
import { AbstrakAparatur, PolaGrid } from "@/components/publik/ilustrasi";
import { SampulBerita } from "@/components/publik/sampul";
import { Kartu, KartuIsi, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { identitasInstansi } from "@/lib/data/instansi";
import { PENCARIAN_POPULER, TUGAS_FUNGSI } from "@/lib/data/profil";
import { LABEL_KATEGORI_BERITA, LABEL_PRIORITAS } from "@/lib/label";
import { tanggalPanjang, tanggalRingkas } from "@/lib/utils";

export const revalidate = 120;

/**
 * Beranda portal publik, disusun mengikuti gaya portal pemerintah
 * (acuan: jabarprov.go.id) dengan identitas warna navy-emas BKPSDM.
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
      .limit(7),
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

  const utama = berita[0];
  const daftarBerita = berita.slice(1, 7);

  const statistik = [
    { label: "Pegawai aktif", nilai: jumlahPegawai[0]?.n ?? 0, ikon: Users },
    { label: "Unit kerja", nilai: jumlahUnit[0]?.n ?? 0, ikon: BadgeCheck },
    { label: "Layanan informasi", nilai: layanan.length, ikon: FileText },
    { label: "Berita & kegiatan", nilai: jumlahBerita[0]?.n ?? 0, ikon: Images },
  ];

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0" aria-hidden>
          <AbstrakAparatur className="absolute right-[-6%] top-1/2 hidden w-[62%] max-w-3xl -translate-y-1/2 opacity-30 lg:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/95 to-navy-900/40" />
          <PolaGrid className="text-white/25" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 lg:pb-24 lg:pt-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emas-200 ring-1 ring-white/20">
            Portal Resmi Kepegawaian
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
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
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy-100 sm:text-base">
            {instansi.berandaSubjudul}
          </p>

          <form
            action="/berita"
            method="get"
            className="mt-6 flex w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Cari berita, layanan, atau informasi..."
                aria-label="Pencarian"
                className="h-12 w-full bg-transparent pl-11 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 bg-emas-500 px-6 text-sm font-bold text-navy-950 transition-colors hover:bg-emas-400"
            >
              Cari
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-navy-200">Populer:</span>
            {PENCARIAN_POPULER.map((k) => (
              <Link
                key={k}
                href={`/berita?q=${encodeURIComponent(k)}`}
                className="rounded-full bg-white/10 px-3 py-1 font-medium text-white/90 ring-1 ring-white/15 transition-colors hover:bg-white/20"
              >
                {k}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- BANNER PROMO + STATISTIK ---------------- */}
      <section className="mx-auto -mt-14 max-w-6xl px-4 sm:px-6">
        <BannerPromo />

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:grid-cols-4 sm:gap-4 sm:p-5">
          {statistik.map((s) => {
            const Ikon = s.ikon;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <Ikon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xl font-bold text-navy-800 sm:text-2xl">
                    {s.nilai}
                  </p>
                  <p className="truncate text-[11px] text-navy-500 sm:text-xs">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- BERITA TERKINI ---------------- */}
      {utama ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Berita</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">Berita Terkini</h2>
            </div>
            <Link
              href="/berita"
              className="inline-flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"
            >
              Lihat semua berita <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Utama */}
            <Link href={`/berita/${utama.slug}`} className="group lg:col-span-2">
              <Kartu className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative">
                  <SampulBerita
                    kategori={utama.kategori}
                    judul={utama.judul}
                    gambarUrl={utama.gambarUrl}
                    className="h-64 w-full sm:h-80"
                  />
                  <span className="absolute left-4 top-4">
                    <Lencana nada="emas">
                      {LABEL_KATEGORI_BERITA[utama.kategori] ?? utama.kategori}
                    </Lencana>
                  </span>
                </div>
                <KartuIsi>
                  <h3 className="text-lg font-bold text-navy-800 group-hover:text-navy-900">
                    {utama.judul}
                  </h3>
                  {utama.ringkasan ? (
                    <p className="mt-2 line-clamp-2 text-sm text-navy-600">{utama.ringkasan}</p>
                  ) : null}
                  <p className="mt-3 flex items-center gap-1 text-xs text-navy-400">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {tanggalPanjang(utama.tanggalTerbit)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                    Baca selengkapnya <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </KartuIsi>
              </Kartu>
            </Link>

            {/* Daftar terbaru */}
            <div>
              <div className="mb-3 flex items-center gap-2 border-b border-navy-100 pb-2">
                <span className="text-sm font-bold uppercase tracking-wide text-navy-800">
                  Terbaru
                </span>
              </div>
              <ul className="divide-y divide-navy-50">
                {daftarBerita.map((b) => (
                  <li key={b.id}>
                    <Link href={`/berita/${b.slug}`} className="flex gap-3 py-3 group">
                      <SampulBerita
                        kategori={b.kategori}
                        judul={b.judul}
                        gambarUrl={b.gambarUrl}
                        className="h-16 w-20 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emas-600">
                          {LABEL_KATEGORI_BERITA[b.kategori] ?? b.kategori}
                        </p>
                        <p className="line-clamp-2 text-sm font-semibold text-navy-800 group-hover:text-navy-900">
                          {b.judul}
                        </p>
                        <p className="mt-0.5 text-xs text-navy-400">
                          {tanggalRingkas(b.tanggalTerbit)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- LAYANAN POPULER ---------------- */}
      <section className="bg-navy-50/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Layanan</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
                Layanan Kepegawaian
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-navy-500">
                Syarat, alur, dan perkiraan waktu pengajuan layanan ASN.
              </p>
            </div>
            <Link
              href="/layanan"
              className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800"
            >
              Lihat semua layanan <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layanan.map((l) => (
              <Link key={l.id} href={`/layanan/${l.slug}`} className="group">
                <Kartu className="flex h-full flex-col transition-all duration-200 group-hover:-translate-y-1 group-hover:border-emas-300 group-hover:shadow-md">
                  <KartuIsi className="flex flex-1 flex-col">
                    <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 group-hover:bg-emas-100 group-hover:text-emas-700">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="font-semibold text-navy-800 group-hover:text-navy-900">
                      {l.judul}
                    </h3>
                    {l.ringkasan ? (
                      <p className="mt-1 line-clamp-3 flex-1 text-sm text-navy-600">{l.ringkasan}</p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between">
                      {l.waktuPenyelesaian ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-600">
                          <Clock className="h-3 w-3" aria-hidden />
                          {l.waktuPenyelesaian}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                        Selengkapnya <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </KartuIsi>
                </Kartu>
              </Link>
            ))}
            {layanan.length === 0 ? (
              <Kartu className="sm:col-span-2 lg:col-span-3">
                <KartuIsi className="text-sm text-navy-500">Belum ada layanan publik.</KartuIsi>
              </Kartu>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------------- AGENDA & PENGUMUMAN ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Agenda</p>
                <h2 className="mt-1 text-2xl font-bold text-navy-800">Agenda Kegiatan</h2>
              </div>
              <Link
                href="/agenda"
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Kalender <ArrowRight className="h-4 w-4" aria-hidden />
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
                          <h3 className="line-clamp-2 font-semibold text-navy-800">{a.judul}</h3>
                          <p className="text-xs text-navy-500">{tanggalPanjang(a.mulai)}</p>
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
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emas-600">
                  Pengumuman
                </p>
                <h2 className="mt-1 text-2xl font-bold text-navy-800">Pengumuman Resmi</h2>
              </div>
              <Link
                href="/pengumuman"
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Semua <ArrowRight className="h-4 w-4" aria-hidden />
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
                            <Lencana nada={LABEL_PRIORITAS[p.prioritas]?.nada}>
                              {LABEL_PRIORITAS[p.prioritas]?.label ?? p.prioritas}
                            </Lencana>
                          ) : null}
                        </div>
                        {p.ringkasan ? (
                          <p className="mt-1 line-clamp-2 text-sm text-navy-600">{p.ringkasan}</p>
                        ) : null}
                        <p className="mt-2 flex items-center gap-1 text-xs text-navy-400">
                          <Megaphone className="h-3.5 w-3.5" aria-hidden />
                          {tanggalRingkas(p.tanggalMulai)}
                        </p>
                      </KartuIsi>
                    </Kartu>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- TENTANG & TUGAS ---------------- */}
      <section className="bg-navy-50/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Tentang</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
              {instansi.namaSingkat}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              Instansi pemerintah daerah yang melaksanakan urusan kepegawaian dan pengembangan
              sumber daya manusia di Kabupaten Yahukimo.
            </p>

            <Kartu className="mt-6 border-navy-100">
              <KartuIsi className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-emas-400">
                  {(kaban[0]?.nama ?? "KB").slice(0, 1)}
                </span>
                <div>
                  <p className="font-bold text-navy-800">
                    {instansi.berandaSambutanNama || kaban[0]?.nama || "Kepala BKPSDM"}
                  </p>
                  <p className="text-xs text-navy-500">
                    {instansi.berandaSambutanJabatan ||
                      kaban[0]?.jabatan ||
                      "Kepala Badan Kepegawaian dan Pengembangan SDM"}
                  </p>
                </div>
              </KartuIsi>
            </Kartu>

            <Link
              href="/profil"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-navy-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Profil &amp; Struktur Organisasi
            </Link>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emas-600">
              Tugas &amp; Fungsi
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">Yang kami kerjakan</h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {TUGAS_FUNGSI.slice(0, 6).map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2 rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm text-navy-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- GALERI ---------------- */}
      {galeri.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Galeri</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
                Dokumentasi Kegiatan
              </h2>
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
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
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
                  href="/layanan"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Layanan kepegawaian
                </Link>
              </div>
            </div>
            <CalendarDays className="hidden h-24 w-24 text-white/20 sm:block" aria-hidden />
          </div>
        </div>
      </section>
    </div>
  );
}
