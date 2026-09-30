import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Images,
  MapPin,
  Megaphone,
  MessageCircle,
  Quote,
  Users,
} from "lucide-react";
import Link from "next/link";

import { HeroBeranda } from "@/components/publik/hero-beranda";
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
 * (acuan: jabarprov.go.id) dengan palet biru muda dan tata letak yang bersih.
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
  const slides = berita.slice(0, 5);

  const statistik = [
    { label: "Pegawai aktif", nilai: jumlahPegawai[0]?.n ?? 0, ikon: Users },
    { label: "Unit kerja", nilai: jumlahUnit[0]?.n ?? 0, ikon: Building2 },
    { label: "Layanan informasi", nilai: layanan.length, ikon: FileText },
    { label: "Berita & kegiatan", nilai: jumlahBerita[0]?.n ?? 0, ikon: Images },
  ];

  const namaKaban = instansi.berandaSambutanNama || kaban[0]?.nama || "Kepala BKPSDM";
  const jabatanKaban =
    instansi.berandaSambutanJabatan ||
    kaban[0]?.jabatan ||
    "Kepala Badan Kepegawaian dan Pengembangan SDM";
  const paragrafSambutan = (instansi.berandaSambutanIsi || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <HeroBeranda
        judul={instansi.berandaJudul}
        subjudul={instansi.berandaSubjudul}
        slides={slides}
        populer={PENCARIAN_POPULER}
      />

      {/* ---------------- STATISTIK ---------------- */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-biru-100 bg-white p-4 shadow-lg shadow-biru-950/5 sm:grid-cols-4 sm:gap-4 sm:p-5">
          {statistik.map((s) => {
            const Ikon = s.ikon;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-biru-50 text-biru-600">
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

      {/* ---------------- LAYANAN POPULER ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-biru-600">Layanan</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
              Layanan Kepegawaian
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-navy-500">
              Syarat, alur, dan perkiraan waktu pengajuan layanan ASN.
            </p>
          </div>
          <Link
            href="/layanan"
            className="inline-flex items-center gap-1 rounded-full border border-biru-200 px-4 py-1.5 text-sm font-semibold text-biru-700 transition-colors hover:bg-biru-50"
          >
            Lihat semua layanan <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {layanan.map((l) => (
            <Link key={l.id} href={`/layanan/${l.slug}`} className="group">
              <Kartu className="flex h-full flex-col border-biru-100 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-biru-300 group-hover:shadow-lg group-hover:shadow-biru-950/5">
                <KartuIsi className="flex flex-1 flex-col">
                  <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-biru-50 text-biru-600 transition-colors group-hover:bg-biru-600 group-hover:text-white">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold text-navy-800 group-hover:text-biru-700">
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
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-biru-600">
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
      </section>

      {/* ---------------- BERITA TERKINI ---------------- */}
      {utama ? (
        <section className="border-y border-biru-100 bg-biru-50/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-biru-600">
                  Berita
                </p>
                <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
                  Berita Terkini
                </h2>
              </div>
              <Link
                href="/berita"
                className="inline-flex items-center gap-1 rounded-full border border-biru-200 bg-white px-4 py-1.5 text-sm font-semibold text-biru-700 transition-colors hover:bg-biru-50"
              >
                Lihat semua berita <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Utama */}
              <Link href={`/berita/${utama.slug}`} className="group lg:col-span-2">
                <Kartu className="h-full overflow-hidden border-biru-100 transition-shadow hover:shadow-xl hover:shadow-biru-950/5">
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
                    <h3 className="text-lg font-bold text-navy-800 group-hover:text-biru-700">
                      {utama.judul}
                    </h3>
                    {utama.ringkasan ? (
                      <p className="mt-2 line-clamp-2 text-sm text-navy-600">{utama.ringkasan}</p>
                    ) : null}
                    <p className="mt-3 flex items-center gap-1 text-xs text-navy-400">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {tanggalPanjang(utama.tanggalTerbit)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-biru-600">
                      Baca selengkapnya <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </KartuIsi>
                </Kartu>
              </Link>

              {/* Daftar terbaru */}
              <div>
                <div className="mb-3 flex items-center gap-2 border-b border-biru-100 pb-2">
                  <span className="text-sm font-bold uppercase tracking-wide text-navy-800">
                    Terbaru
                  </span>
                </div>
                <ul className="divide-y divide-biru-100">
                  {daftarBerita.map((b) => (
                    <li key={b.id}>
                      <Link href={`/berita/${b.slug}`} className="group flex gap-3 py-3">
                        <SampulBerita
                          kategori={b.kategori}
                          judul={b.judul}
                          gambarUrl={b.gambarUrl}
                          className="h-16 w-20 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-biru-600">
                            {LABEL_KATEGORI_BERITA[b.kategori] ?? b.kategori}
                          </p>
                          <p className="line-clamp-2 text-sm font-semibold text-navy-800 group-hover:text-biru-700">
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
          </div>
        </section>
      ) : null}

      {/* ---------------- AGENDA & PENGUMUMAN ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-biru-600">
                  Agenda
                </p>
                <h2 className="mt-1 text-2xl font-bold text-navy-800">Agenda Kegiatan</h2>
              </div>
              <Link
                href="/agenda"
                className="inline-flex items-center gap-1 text-sm font-semibold text-biru-600 hover:text-biru-700"
              >
                Kalender <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {agenda.length === 0 ? (
              <Kartu className="border-biru-100">
                <KartuIsi className="text-sm text-navy-500">Belum ada agenda publik.</KartuIsi>
              </Kartu>
            ) : (
              <ul className="space-y-3">
                {agenda.map((a) => (
                  <li key={a.id}>
                    <Kartu className="border-biru-100 transition-shadow hover:shadow-md">
                      <KartuIsi className="flex items-start gap-3">
                        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-biru-600 to-biru-800 text-white">
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
                <p className="text-xs font-bold uppercase tracking-widest text-biru-600">
                  Pengumuman
                </p>
                <h2 className="mt-1 text-2xl font-bold text-navy-800">Pengumuman Resmi</h2>
              </div>
              <Link
                href="/pengumuman"
                className="inline-flex items-center gap-1 text-sm font-semibold text-biru-600 hover:text-biru-700"
              >
                Semua <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {pengumuman.length === 0 ? (
              <Kartu className="border-biru-100">
                <KartuIsi className="text-sm text-navy-500">Belum ada pengumuman publik.</KartuIsi>
              </Kartu>
            ) : (
              <ul className="space-y-3">
                {pengumuman.map((p) => (
                  <li key={p.id}>
                    <Kartu className="border-biru-100 transition-shadow hover:shadow-md">
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

      {/* ---------------- SAMBUTAN KEPALA BADAN ---------------- */}
      <section className="border-y border-biru-100 bg-biru-50/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-biru-600">Tentang</p>
            <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
              {instansi.namaSingkat}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              Instansi pemerintah daerah yang melaksanakan urusan kepegawaian dan pengembangan
              sumber daya manusia di Kabupaten Yahukimo.
            </p>

            <Kartu className="mt-6 overflow-hidden border-biru-100">
              <div className="h-1 w-full bg-gradient-to-r from-biru-600 via-biru-400 to-emas-400" />
              <KartuIsi className="flex items-center gap-4">
                {instansi.berandaSambutanFoto ? (
                  <img
                    src={instansi.berandaSambutanFoto}
                    alt={namaKaban}
                    className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-biru-100"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-biru-600 to-biru-800 text-lg font-bold text-emas-300">
                    {namaKaban.slice(0, 1)}
                  </span>
                )}
                <div>
                  <p className="font-bold text-navy-800">{namaKaban}</p>
                  <p className="text-xs text-navy-500">{jabatanKaban}</p>
                </div>
              </KartuIsi>
            </Kartu>

            <Link
              href="/profil"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-biru-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-biru-700"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Profil &amp; Struktur Organisasi
            </Link>
          </div>

          <div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-biru-100 text-biru-600">
              <Quote className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-2xl font-bold text-navy-800 sm:text-3xl">
              {instansi.berandaSambutanJudul}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-navy-600">
              {paragrafSambutan.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-navy-500">
                Tugas &amp; Fungsi
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {TUGAS_FUNGSI.slice(0, 6).map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 rounded-lg border border-biru-100 bg-white px-3 py-2 text-sm text-navy-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-biru-500" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- GALERI ---------------- */}
      {galeri.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-biru-600">Galeri</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-800 sm:text-3xl">
                Dokumentasi Kegiatan
              </h2>
            </div>
            <Link
              href="/galeri"
              className="inline-flex items-center gap-1 rounded-full border border-biru-200 px-4 py-1.5 text-sm font-semibold text-biru-700 transition-colors hover:bg-biru-50"
            >
              Buka galeri <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {galeri.map((g) => (
              <Link key={g.id} href={`/berita/${g.slug}`} className="group">
                <div className="overflow-hidden rounded-xl border border-biru-100">
                  <SampulBerita
                    kategori={g.kategori}
                    judul={g.judul}
                    gambarUrl={g.gambarUrl}
                    className="h-32 w-full transition-transform duration-300 group-hover:scale-105 sm:h-40"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium text-navy-700 group-hover:text-biru-700">
                  {g.judul}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-biru-700 to-biru-950 px-6 py-12 text-white sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-biru-400/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-emas-400/10 blur-3xl"
          />
          <div className="relative grid items-center gap-8 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Butuh layanan kepegawaian?</h2>
              <p className="mt-2 max-w-xl text-sm text-biru-100">
                Kunjungi kantor {instansi.namaSingkat} pada jam layanan, atau hubungi kami
                melalui halaman kontak untuk informasi lebih lanjut.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/kontak"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-emas-400 px-6 text-sm font-bold text-biru-950 transition-colors hover:bg-emas-300"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Hubungi kami
                </Link>
                <Link
                  href="/layanan"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Layanan kepegawaian
                </Link>
              </div>
            </div>
            <CalendarDays className="hidden h-28 w-28 text-white/15 sm:block" aria-hidden />
          </div>
        </div>
      </section>

      {/* Tombol bantuan melayang (WhatsApp) */}
      {instansi.sosmedWhatsapp ? (
        <a
          href={instansi.sosmedWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi via WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-500/20 transition-colors hover:bg-emerald-600"
        >
          <MessageCircle className="h-6 w-6" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}
