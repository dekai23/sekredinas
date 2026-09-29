import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { Download, FileSpreadsheet, FileText, Gauge } from "lucide-react";

import { Kartu, KartuIsi, KartuKepala, Lencana } from "@/components/ui/dasar";
import { Input } from "@/components/ui/formulir";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { rupiah, rentangBulanSql } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ dari?: string; sampai?: string }> };

const LAPORAN = [
  { tipe: "surat-masuk", judul: "Rekap Surat Masuk", keterangan: "Agenda, asal, perihal, status." },
  { tipe: "surat-keluar", judul: "Rekap Surat Keluar", keterangan: "Nomor, tujuan, status persetujuan." },
  { tipe: "cuti", judul: "Rekap Cuti", keterangan: "Pengajuan dan status persetujuan pegawai." },
  { tipe: "inventaris", judul: "Rekap Inventaris", keterangan: "Kode, kondisi, dan nilai aset." },
  { tipe: "arsip", judul: "Rekap Arsip", keterangan: "Daftar berkas arsip digital." },
];

/** Laporan & statistik dengan ekspor CSV/Excel (PRD 6.J). */
export default async function HalamanLaporan({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/laporan");
  if (!boleh(sesi, "laporan.lihat")) {
    return (
      <Kartu>
        <KartuIsi className="text-sm text-navy-600">
          Anda tidak berwenang membuka laporan.
        </KartuIsi>
      </Kartu>
    );
  }

  const param = await searchParams;
  const bawaan = rentangBulanSql();
  const dari = param.dari || bawaan.mulai;
  const sampai = param.sampai || bawaan.selesai;

  const [masuk, keluar, disposisi, cutiMenunggu, aset, arsip, nilaiAset] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.suratMasuk)
      .where(and(gte(schema.suratMasuk.tanggalTerima, dari), lte(schema.suratMasuk.tanggalTerima, sampai))),
    db
      .select({ n: count() })
      .from(schema.suratKeluar)
      .where(and(gte(schema.suratKeluar.tanggalSurat, dari), lte(schema.suratKeluar.tanggalSurat, sampai))),
    db.select({ n: count() }).from(schema.disposisi).where(eq(schema.disposisi.status, "menunggu")),
    db.select({ n: count() }).from(schema.cuti).where(eq(schema.cuti.status, "menunggu")),
    db.select({ n: count() }).from(schema.inventaris),
    db.select({ n: count() }).from(schema.arsip),
    db
      .select({ total: sql<number>`coalesce(sum(${schema.inventaris.nilaiPerolehan} * ${schema.inventaris.jumlah}), 0)` })
      .from(schema.inventaris),
  ]);

  const kartu = [
    { judul: "Surat masuk", nilai: masuk[0]?.n ?? 0, keterangan: `${dari} s.d. ${sampai}` },
    { judul: "Surat keluar", nilai: keluar[0]?.n ?? 0, keterangan: `${dari} s.d. ${sampai}` },
    { judul: "Disposisi aktif", nilai: disposisi[0]?.n ?? 0, keterangan: "Menunggu tindak lanjut" },
    { judul: "Cuti menunggu", nilai: cutiMenunggu[0]?.n ?? 0, keterangan: "Perlu diproses" },
    { judul: "Jenis aset", nilai: aset[0]?.n ?? 0, keterangan: "Inventaris tercatat" },
    { judul: "Berkas arsip", nilai: arsip[0]?.n ?? 0, keterangan: "Arsip digital" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Laporan & Statistik</h1>
        <p className="text-sm text-navy-500">
          Rekap real-time dan ekspor data. Nilai aset tercatat: {rupiah(nilaiAset[0]?.total ?? 0)}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kartu.map((k) => (
          <Kartu key={k.judul}>
            <KartuIsi className="flex items-start gap-3">
              <span className="rounded-lg bg-navy-50 p-2 text-navy-600">
                <Gauge className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium text-navy-500">{k.judul}</p>
                <p className="font-mono text-2xl font-bold text-navy-800">{k.nilai}</p>
                <p className="text-xs text-navy-500">{k.keterangan}</p>
              </div>
            </KartuIsi>
          </Kartu>
        ))}
      </div>

      <Kartu>
        <KartuKepala
          judul="Rentang tanggal ekspor"
          deskripsi="Berlaku untuk rekap surat masuk & surat keluar."
        />
        <KartuIsi>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-navy-700">Dari</span>
              <Input type="date" name="dari" defaultValue={dari} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium text-navy-700">Sampai</span>
              <Input type="date" name="sampai" defaultValue={sampai} />
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 text-sm font-semibold text-navy-700 hover:bg-navy-50"
            >
              Terapkan
            </button>
          </form>
        </KartuIsi>
      </Kartu>

      <Kartu>
        <KartuKepala
          judul="Ekspor laporan"
          deskripsi="Format CSV dapat dibuka di Excel/LibreOffice. Untuk PDF, gunakan Cetak → Simpan sebagai PDF."
          aksi={<Lencana nada="emas"><FileSpreadsheet className="h-3 w-3" aria-hidden /> Siap unduh</Lencana>}
        />
        <KartuIsi>
          <ul className="grid gap-3 sm:grid-cols-2">
            {LAPORAN.map((l) => (
              <li key={l.tipe} className="flex items-start justify-between gap-3 rounded-lg border border-navy-100 px-4 py-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-800">
                    <FileText className="h-4 w-4 text-navy-400" aria-hidden />
                    {l.judul}
                  </p>
                  <p className="text-xs text-navy-500">{l.keterangan}</p>
                </div>
                <a
                  href={`/api/laporan/${l.tipe}?dari=${dari}&sampai=${sampai}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  CSV
                </a>
              </li>
            ))}
          </ul>
        </KartuIsi>
      </Kartu>
    </div>
  );
}
