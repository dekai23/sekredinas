import { and, asc, eq, gte, lt } from "drizzle-orm";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";

import { TombolHapus } from "@/components/internal/tombol-hapus";
import { Kartu, KartuIsi, KartuKepala, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { bangunKalender, geserBulan, labelBulan, NAMA_HARI } from "@/lib/kalender";
import { LABEL_JENIS_AGENDA } from "@/lib/label";
import { formatWaktuLokal, tanggalPanjang } from "@/lib/utils";

import { hapusAgenda } from "./aksi";
import { FormAgenda } from "./form-agenda";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ bulan?: string; hari?: string }> };

/** Agenda kegiatan: kalender bulanan + daftar harian + agenda publik (PRD 6.F). */
export default async function HalamanAgenda({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/agenda");
  const bolehKelola = boleh(sesi, "agenda.kelola");
  const param = await searchParams;

  const hariIni = formatWaktuLokal(new Date()).slice(0, 10);
  const bulan = /^\d{4}-\d{2}$/.test(param.bulan ?? "") ? param.bulan! : hariIni.slice(0, 7);
  const hariDipilih = param.hari && /^\d{4}-\d{2}-\d{2}$/.test(param.hari) ? param.hari : hariIni;

  const awalBulan = `${bulan}-01T00:00:00+09:00`;
  const bulanBerikut = geserBulan(bulan, 1);
  const awalBulanBerikut = `${bulanBerikut}-01T00:00:00+09:00`;

  const [agendaBulan, pegawai] = await Promise.all([
    db
      .select({
        id: schema.agenda.id,
        judul: schema.agenda.judul,
        deskripsi: schema.agenda.deskripsi,
        lokasi: schema.agenda.lokasi,
        mulai: schema.agenda.mulai,
        selesai: schema.agenda.selesai,
        jenis: schema.agenda.jenis,
        publik: schema.agenda.publik,
        penanggungJawabId: schema.agenda.penanggungJawabId,
        penanggungJawab: schema.pegawai.namaLengkap,
      })
      .from(schema.agenda)
      .leftJoin(schema.pegawai, eq(schema.agenda.penanggungJawabId, schema.pegawai.id))
      .where(
        and(
          gte(schema.agenda.mulai, new Date(awalBulan)),
          lt(schema.agenda.mulai, new Date(awalBulanBerikut)),
        ),
      )
      .orderBy(asc(schema.agenda.mulai)),
    db
      .select({ id: schema.pegawai.id, nama: schema.pegawai.namaLengkap })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.aktif, true))
      .orderBy(asc(schema.pegawai.namaLengkap)),
  ]);

  const semuaPegawai = pegawai;
  const perTanggal = new Map<string, typeof agendaBulan>();
  for (const a of agendaBulan) {
    const kunci = formatWaktuLokal(a.mulai).slice(0, 10);
    const daftar = perTanggal.get(kunci) ?? [];
    daftar.push(a);
    perTanggal.set(kunci, daftar);
  }

  const sel = bangunKalender(bulan, hariIni);
  const agendaHari = perTanggal.get(hariDipilih) ?? [];

  const agendaMendatang = await db
    .select({
      id: schema.agenda.id,
      judul: schema.agenda.judul,
      mulai: schema.agenda.mulai,
      lokasi: schema.agenda.lokasi,
      jenis: schema.agenda.jenis,
    })
    .from(schema.agenda)
    .where(gte(schema.agenda.mulai, new Date()))
    .orderBy(asc(schema.agenda.mulai))
    .limit(6);

  const namaBulan = labelBulan(bulan);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Agenda Kegiatan</h1>
          <p className="text-sm text-navy-500">
            Kalender kegiatan internal dan agenda yang ditayangkan ke portal publik.
          </p>
        </div>
        <a
          href="/agenda"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          Lihat agenda publik →
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Kalender */}
        <Kartu className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
            <Link
              href={`/dashboard/agenda?bulan=${geserBulan(bulan, -1)}`}
              className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-base font-bold text-navy-800">
              {namaBulan}
            </h2>
            <Link
              href={`/dashboard/agenda?bulan=${geserBulan(bulan, 1)}`}
              className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <KartuIsi>
            <div className="grid grid-cols-7 gap-1">
              {NAMA_HARI.map((h) => (
                <div
                  key={h}
                  className="py-1 text-center text-xs font-bold uppercase tracking-wide text-navy-400"
                >
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
                    href={`/dashboard/agenda?bulan=${bulan}&hari=${s.tanggal}`}
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
                        (dipilih
                          ? "text-white"
                          : s.iniHariIni
                            ? "text-emas-600"
                            : "text-navy-700")
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
                            (dipilih
                              ? "bg-white/20 text-white"
                              : a.publik
                                ? "bg-emas-100 text-emas-700"
                                : "bg-teal-100 text-teal-700")
                          }
                        >
                          {a.judul}
                        </span>
                      ))}
                      {acara.length > 2 ? (
                        <span className={"text-[10px] " + (dipilih ? "text-white/80" : "text-navy-400")}>
                          +{acara.length - 2} lagi
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-navy-400">
              Keterangan:{" "}
              <span className="rounded bg-emas-100 px-1 text-emas-700">kuning = agenda publik</span>
              {" · "}
              <span className="rounded bg-teal-100 px-1 text-teal-700">hijau = internal</span>
            </p>
          </KartuIsi>
        </Kartu>

        {/* Daftar harian */}
        <Kartu>
          <KartuKepala judul="Agenda hari terpilih" deskripsi={tanggalPanjang(hariDipilih)} />
          {agendaHari.length === 0 ? (
            <KeadaanKosong
              judul="Tidak ada agenda"
              deskripsi="Tidak ada kegiatan pada tanggal ini."
              ikon={<CalendarDays className="h-8 w-8" aria-hidden />}
            />
          ) : (
            <ul className="divide-y divide-navy-50">
              {agendaHari.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-navy-800">{a.judul}</p>
                    <Lencana nada={LABEL_JENIS_AGENDA[a.jenis]?.nada}>
                      {LABEL_JENIS_AGENDA[a.jenis]?.label ?? a.jenis}
                    </Lencana>
                  </div>
                  <p className="mt-0.5 text-xs text-navy-500">
                    {formatWaktuLokal(a.mulai).slice(11, 16)} WIT
                    {a.selesai ? ` - ${formatWaktuLokal(a.selesai).slice(11, 16)} WIT` : ""}
                  </p>
                  {a.lokasi ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
                      <MapPin className="h-3 w-3" aria-hidden /> {a.lokasi}
                    </p>
                  ) : null}
                  {a.penanggungJawab ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
                      <Users className="h-3 w-3" aria-hidden /> {a.penanggungJawab}
                    </p>
                  ) : null}
                  {a.publik ? <Lencana nada="emas">Tayang publik</Lencana> : null}

                  {bolehKelola ? (
                    <div className="mt-2">
                      <details className="rounded-lg border border-navy-100 bg-navy-50/50 px-2 py-1">
                        <summary className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                          <Pencil className="h-3 w-3" aria-hidden /> Ubah
                        </summary>
                        <div className="pt-2">
                          <FormAgenda
                            pegawai={semuaPegawai}
                            dataAwal={{
                              id: a.id,
                              judul: a.judul,
                              deskripsi: a.deskripsi ?? "",
                              lokasi: a.lokasi ?? "",
                              mulai: formatWaktuLokal(a.mulai),
                              selesai: a.selesai ? formatWaktuLokal(a.selesai) : "",
                              jenis: a.jenis,
                              publik: a.publik,
                              penanggungJawabId: a.penanggungJawabId ?? "",
                            }}
                          />
                          <div className="pt-2">
                            <TombolHapus aksi={hapusAgenda} id={a.id} konfirmasi={`Hapus agenda "${a.judul}"?`} />
                          </div>
                        </div>
                      </details>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>

      {/* Tambah agenda */}
      {bolehKelola ? (
        <Kartu>
          <KartuKepala
            judul="Tambah agenda"
            aksi={
              <Lencana nada="emas">
                <Plus className="h-3 w-3" aria-hidden /> Agenda baru
              </Lencana>
            }
          />
          <KartuIsi>
            <FormAgenda pegawai={semuaPegawai} />
          </KartuIsi>
        </Kartu>
      ) : null}

      {/* Agenda mendatang */}
      <Kartu>
        <KartuKepala judul="Agenda mendatang" deskripsi="Enam kegiatan terdekat." />
        {agendaMendatang.length === 0 ? (
          <KeadaanKosong judul="Belum ada agenda mendatang" />
        ) : (
          <ul className="divide-y divide-navy-50">
            {agendaMendatang.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-800">{a.judul}</p>
                  <p className="truncate text-xs text-navy-500">
                    {tanggalPanjang(a.mulai)}
                    {a.lokasi ? ` · ${a.lokasi}` : ""}
                  </p>
                </div>
                <Lencana nada={LABEL_JENIS_AGENDA[a.jenis]?.nada}>
                  {LABEL_JENIS_AGENDA[a.jenis]?.label ?? a.jenis}
                </Lencana>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
