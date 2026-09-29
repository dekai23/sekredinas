import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileOutput,
  Inbox,
  Megaphone,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Kartu, KartuIsi, KartuKepala, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { rentangBulanSql, tanggalPanjang, tanggalRingkas } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Dashboard internal: ringkasan kondisi persuratan dan kepegawaian.
 * Modul yang tidak sesuai kewenangan pengguna tidak ditampilkan.
 */
export default async function HalamanDashboard() {
  const sesi = await wajibMasuk("dashboard");
  const { mulai, selesai } = rentangBulanSql();

  const bolehSuratMasuk = boleh(sesi, "surat-masuk.lihat");
  const bolehSuratKeluar = boleh(sesi, "surat-keluar.lihat");
  const bolehCuti = boleh(sesi, "cuti.kelola");

  const [masukBulan, masukMenunggu, keluarBulan, cutiMenunggu, pegawaiAktif] = await Promise.all([
    bolehSuratMasuk
      ? db
          .select({ n: count() })
          .from(schema.suratMasuk)
          .where(
            and(
              gte(schema.suratMasuk.tanggalTerima, mulai),
              lte(schema.suratMasuk.tanggalTerima, selesai),
            ),
          )
      : Promise.resolve([{ n: 0 }]),
    bolehSuratMasuk
      ? db
          .select({ n: count() })
          .from(schema.suratMasuk)
          .where(eq(schema.suratMasuk.status, "terkirim"))
      : Promise.resolve([{ n: 0 }]),
    bolehSuratKeluar
      ? db
          .select({ n: count() })
          .from(schema.suratKeluar)
          .where(
            and(
              gte(schema.suratKeluar.tanggalSurat, mulai),
              lte(schema.suratKeluar.tanggalSurat, selesai),
            ),
          )
      : Promise.resolve([{ n: 0 }]),
    bolehCuti
      ? db.select({ n: count() }).from(schema.cuti).where(eq(schema.cuti.status, "menunggu"))
      : Promise.resolve([{ n: 0 }]),
    db.select({ n: count() }).from(schema.pegawai).where(eq(schema.pegawai.aktif, true)),
  ]);

  const kartu = [
    {
      judul: "Surat masuk bulan ini",
      nilai: masukBulan[0]?.n ?? 0,
      keterangan: `${masukMenunggu[0]?.n ?? 0} menunggu disposisi`,
      href: "/dashboard/surat-masuk",
      ikon: Inbox,
      tampil: bolehSuratMasuk,
    },
    {
      judul: "Surat keluar bulan ini",
      nilai: keluarBulan[0]?.n ?? 0,
      keterangan: "Naskah & nomor surat",
      href: "/dashboard/surat-keluar",
      ikon: FileOutput,
      tampil: bolehSuratKeluar,
    },
    {
      judul: "Cuti menunggu persetujuan",
      nilai: cutiMenunggu[0]?.n ?? 0,
      keterangan: "Perlu ditinjau",
      href: "/dashboard/persetujuan/cuti",
      ikon: ClipboardCheck,
      tampil: bolehCuti,
    },
    {
      judul: "Pegawai aktif",
      nilai: pegawaiAktif[0]?.n ?? 0,
      keterangan: "ASN & tenaga diklat",
      href: "/admin/pengguna",
      ikon: Users,
      tampil: sesi.role === "admin",
    },
  ].filter((k) => k.tampil);

  const agendaMendatang = await db
    .select({
      id: schema.agenda.id,
      judul: schema.agenda.judul,
      mulai: schema.agenda.mulai,
      lokasi: schema.agenda.lokasi,
      jenis: schema.agenda.jenis,
    })
    .from(schema.agenda)
    .orderBy(asc(schema.agenda.mulai))
    .limit(5);

  const pengumumanTerbaru = await db
    .select({
      id: schema.pengumuman.id,
      judul: schema.pengumuman.judul,
      ringkasan: schema.pengumuman.ringkasan,
      prioritas: schema.pengumuman.prioritas,
    })
    .from(schema.pengumuman)
    .orderBy(desc(schema.pengumuman.tanggalMulai))
    .limit(4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Dashboard</h1>
        <p className="text-sm text-navy-500">
          {tanggalPanjang(new Date())} · Selamat datang, {sesi.nama}.
        </p>
      </div>

      {sesi.wajibGantiSandi ? (
        <Kartu className="border-emas-200 bg-emas-50">
          <KartuIsi className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emas-700">Ganti sandi Anda</p>
              <p className="text-sm text-navy-700">
                Ini kunjungan pertama Anda. Sandi awal sebaiknya segera diganti.
              </p>
            </div>
            <Tombol varian="emas" ukuran="kecil">
              Ganti sandi
            </Tombol>
          </KartuIsi>
        </Kartu>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map((k) => {
          const Ikon = k.ikon;
          return (
            <Kartu key={k.judul} className="transition-shadow hover:shadow-md">
              <KartuIsi className="flex items-start gap-3">
                <span className="rounded-lg bg-navy-50 p-2 text-navy-600">
                  <Ikon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-navy-500">{k.judul}</p>
                  <p className="font-mono text-2xl font-bold text-navy-800">{k.nilai}</p>
                  <p className="text-xs text-navy-500">{k.keterangan}</p>
                </div>
              </KartuIsi>
            </Kartu>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu>
          <KartuKepala
            judul="Agenda terdekat"
            aksi={
              <Link
                href="/dashboard/agenda"
                className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800"
              >
                Semua agenda <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          {agendaMendatang.length === 0 ? (
            <KeadaanKosong
              judul="Belum ada agenda"
              deskripsi="Agenda yang dibuat akan tampil di sini."
              ikon={<CalendarDays className="h-8 w-8" aria-hidden />}
            />
          ) : (
            <ul className="divide-y divide-navy-50">
              {agendaMendatang.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-800">{a.judul}</p>
                    <p className="truncate text-xs text-navy-500">
                      {tanggalRingkas(a.mulai)}
                      {a.lokasi ? ` · ${a.lokasi}` : ""}
                    </p>
                  </div>
                  <Lencana>{a.jenis}</Lencana>
                </li>
              ))}
            </ul>
          )}
        </Kartu>

        <Kartu>
          <KartuKepala judul="Pengumuman terbaru" />
          {pengumumanTerbaru.length === 0 ? (
            <KeadaanKosong
              judul="Belum ada pengumuman"
              deskripsi="Pengumuman internal dan publik akan tampil di sini."
              ikon={<Megaphone className="h-8 w-8" aria-hidden />}
            />
          ) : (
            <ul className="divide-y divide-navy-50">
              {pengumumanTerbaru.map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-navy-800">{p.judul}</p>
                    {p.prioritas !== "biasa" ? (
                      <Lencana nada={p.prioritas === "segera" ? "perhatian" : "emas"}>
                        {p.prioritas}
                      </Lencana>
                    ) : null}
                  </div>
                  {p.ringkasan ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-navy-500">{p.ringkasan}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>

      <Kartu>
        <KartuKepala
          judul="Akses cepat modul"
          deskripsi="Arsip digital, agenda, pengumuman, dan cuti kini tersedia."
        />
        <KartuIsi>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Arsip Digital", href: "/dashboard/arsip", izin: "arsip.lihat" as const },
              { label: "Agenda Kegiatan", href: "/dashboard/agenda", izin: "agenda.lihat" as const },
              { label: "Pengumuman", href: "/dashboard/pengumuman", izin: "pengumuman.lihat" as const },
              { label: "Cuti Saya", href: "/dashboard/cuti", izin: "cuti.buat" as const },
              { label: "Inventaris Aset", href: "/dashboard/inventaris", izin: "inventaris.lihat" as const },
              { label: "Laporan", href: "/dashboard/laporan", izin: "laporan.lihat" as const },
            ]
              .filter((m) => boleh(sesi, m.izin))
              .map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3 text-sm font-semibold text-navy-700 transition-colors hover:border-emas-300 hover:bg-navy-50"
                >
                  {m.label}
                  <ArrowRight className="h-4 w-4 text-navy-400" aria-hidden />
                </Link>
              ))}
          </div>
        </KartuIsi>
      </Kartu>
    </div>
  );
}