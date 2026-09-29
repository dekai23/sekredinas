import type { Metadata } from "next";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import { GelombangNavy } from "@/components/publik/ilustrasi";
import { Kartu, KartuIsi, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { bangunKalender, geserBulan, labelBulan, NAMA_HARI } from "@/lib/kalender";
import { LABEL_JENIS_AGENDA } from "@/lib/label";
import { formatWaktuLokal, tanggalPanjang } from "@/lib/utils";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description:
    "Kalender kegiatan publik Badan Kepegawaian dan Pengembangan Sumber Daya Manusia " +
    "Kabupaten Yahukimo.",
};

type Props = { searchParams: Promise<{ bulan?: string; hari?: string }> };

/** Agenda publik: kalender bulanan + daftar per hari (hanya agenda `publik`). */
export default async function HalamanAgendaPublik({ searchParams }: Props) {
  const param = await searchParams;
  const hariIni = formatWaktuLokal(new Date()).slice(0, 10);
  const bulan = /^\d{4}-\d{2}$/.test(param.bulan ?? "") ? param.bulan! : hariIni.slice(0, 7);
  const hariDipilih = param.hari && /^\d{4}-\d{2}-\d{2}$/.test(param.hari) ? param.hari : hariIni;

  const awal = new Date(`${bulan}-01T00:00:00+09:00`);
  const bulanBerikut = geserBulan(bulan, 1);
  const akhir = new Date(`${bulanBerikut}-01T00:00:00+09:00`);

  const agenda = await db
    .select({
      id: schema.agenda.id,
      judul: schema.agenda.judul,
      deskripsi: schema.agenda.deskripsi,
      lokasi: schema.agenda.lokasi,
      mulai: schema.agenda.mulai,
      selesai: schema.agenda.selesai,
      jenis: schema.agenda.jenis,
    })
    .from(schema.agenda)
    .where(
      and(
        eq(schema.agenda.publik, true),
        gte(schema.agenda.mulai, awal),
        lt(schema.agenda.mulai, akhir),
      ),
    )
    .orderBy(asc(schema.agenda.mulai));

  const perTanggal = new Map<string, typeof agenda>();
  for (const a of agenda) {
    const kunci = formatWaktuLokal(a.mulai).slice(0, 10);
    const daftar = perTanggal.get(kunci) ?? [];
    daftar.push(a);
    perTanggal.set(kunci, daftar);
  }

  const sel = bangunKalender(bulan, hariIni);
  const agendaHari = perTanggal.get(hariDipilih) ?? [];
  const semuaAgendaBulan = agenda;

  return (
    <div>
      <section className="relative overflow-hidden">
        <GelombangNavy className="absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Lencana nada="emas">Agenda</Lencana>
          <h1 className="mt-3 text-3xl font-bold text-white">Agenda Kegiatan Publik</h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-100">
            Jadwal kegiatan yang terbuka untuk masyarakat dan mitra instansi.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <Kartu className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
            <Link
              href={`/agenda?bulan=${geserBulan(bulan, -1)}`}
              className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-base font-bold text-navy-800">{labelBulan(bulan)}</h2>
            <Link
              href={`/agenda?bulan=${geserBulan(bulan, 1)}`}
              className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <KartuIsi>
            <div className="grid grid-cols-7 gap-1">
              {NAMA_HARI.map((h) => (
                <div key={h} className="py-1 text-center text-xs font-bold uppercase tracking-wide text-navy-400">
                  {h}
                </div>
              ))}
              {sel.map((s, i) => {
                if (!s.dalamBulan) return <div key={`kosong-${i}`} />;
                const acara = perTanggal.get(s.tanggal) ?? [];
                const dipilih = s.tanggal === hariDipilih;
                return (
                  <Link
                    key={s.tanggal}
                    href={`/agenda?bulan=${bulan}&hari=${s.tanggal}`}
                    className={
                      "flex min-h-[72px] flex-col rounded-lg border p-1.5 text-left transition-colors " +
                      (dipilih
                        ? "border-navy-600 bg-navy-700 text-white"
                        : "border-navy-100 hover:border-navy-300 hover:bg-navy-50")
                    }
                  >
                    <span
                      className={
                        "text-xs font-semibold " +
                        (dipilih ? "text-white" : s.iniHariIni ? "text-emas-600" : "text-navy-700")
                      }
                    >
                      {s.hari}
                    </span>
                    <span className="mt-0.5 flex flex-col gap-0.5">
                      {acara.slice(0, 2).map((a) => (
                        <span
                          key={a.id}
                          className={
                            "truncate rounded px-1 text-[10px] font-medium " +
                            (dipilih ? "bg-white/20 text-white" : "bg-emas-100 text-emas-700")
                          }
                        >
                          {a.judul}
                        </span>
                      ))}
                    </span>
                  </Link>
                );
              })}
            </div>
          </KartuIsi>
        </Kartu>

        <Kartu>
          <div className="border-b border-navy-100 px-5 py-3">
            <h2 className="text-base font-bold text-navy-800">Agenda hari terpilih</h2>
            <p className="text-sm text-navy-500">{tanggalPanjang(hariDipilih)}</p>
          </div>
          {agendaHari.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-navy-500">
              <CalendarDays className="mx-auto mb-2 h-8 w-8 text-navy-300" aria-hidden />
              Tidak ada agenda publik pada tanggal ini.
            </div>
          ) : (
            <ul className="divide-y divide-navy-50">
              {agendaHari.map((a) => (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-navy-800">{a.judul}</h3>
                    <Lencana nada={LABEL_JENIS_AGENDA[a.jenis]?.nada}>
                      {LABEL_JENIS_AGENDA[a.jenis]?.label ?? a.jenis}
                    </Lencana>
                  </div>
                  <p className="mt-1 text-xs text-navy-500">
                    {formatWaktuLokal(a.mulai).slice(11, 16)} WIT
                    {a.selesai ? ` - ${formatWaktuLokal(a.selesai).slice(11, 16)} WIT` : ""}
                  </p>
                  {a.lokasi ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
                      <MapPin className="h-3 w-3" aria-hidden /> {a.lokasi}
                    </p>
                  ) : null}
                  {a.deskripsi ? <p className="mt-2 text-sm text-navy-600">{a.deskripsi}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-4 text-xl font-bold text-navy-800">Kegiatan bulan ini</h2>
        {semuaAgendaBulan.length === 0 ? (
          <Kartu>
            <KartuIsi className="text-sm text-navy-500">Belum ada agenda publik bulan ini.</KartuIsi>
          </Kartu>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {semuaAgendaBulan.map((a) => (
              <Kartu key={a.id} className="transition-shadow hover:shadow-md">
                <KartuIsi>
                  <p className="text-xs font-semibold text-teal-600">{tanggalPanjang(a.mulai)}</p>
                  <h3 className="mt-1 font-semibold text-navy-800">{a.judul}</h3>
                  {a.lokasi ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
                      <MapPin className="h-3 w-3" aria-hidden /> {a.lokasi}
                    </p>
                  ) : null}
                </KartuIsi>
              </Kartu>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
