import { desc, eq } from "drizzle-orm";
import { CalendarCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";

import {
  Kartu,
  KartuIsi,
  KartuKepala,
  KeadaanKosong,
  Lencana,
  Sel,
  SelKepala,
  TabelBaris,
  TabelKepala,
  TabelPembungkus,
} from "@/components/ui/dasar";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_JENIS_CUTI } from "@/lib/label";
import { tanggalSedang, tanggalSql } from "@/lib/utils";

import { FormCuti } from "./form-cuti";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; nada: "perhatian" | "sukses" | "bahaya"; ikon: typeof Clock }> = {
  menunggu: { label: "Menunggu", nada: "perhatian", ikon: Clock },
  disetujui: { label: "Disetujui", nada: "sukses", ikon: CheckCircle2 },
  ditolak: { label: "Ditolak", nada: "bahaya", ikon: XCircle },
};

/** Pengajuan cuti pegawai & riwayatnya (PRD 6.G). */
export default async function HalamanCuti() {
  const sesi = await wajibMasuk("dashboard/cuti");
  const bolehAjukan = boleh(sesi, "cuti.buat");
  const bolehKelola = boleh(sesi, "cuti.kelola");

  const [pegawai, riwayat] = await Promise.all([
    db
      .select({ sisaCuti: schema.pegawai.sisaCuti })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.id, sesi.id))
      .limit(1),
    db
      .select({
        id: schema.cuti.id,
        jenisCuti: schema.cuti.jenisCuti,
        tanggalMulai: schema.cuti.tanggalMulai,
        tanggalSelesai: schema.cuti.tanggalSelesai,
        totalHari: schema.cuti.totalHari,
        alasan: schema.cuti.alasan,
        status: schema.cuti.status,
        catatanPersetujuan: schema.cuti.catatanPersetujuan,
      })
      .from(schema.cuti)
      .where(eq(schema.cuti.pegawaiId, sesi.id))
      .orderBy(desc(schema.cuti.createdAt)),
  ]);

  const sisaCuti = pegawai[0]?.sisaCuti ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Cuti</h1>
          <p className="text-sm text-navy-500">Ajukan cuti dan pantau status persetujuannya.</p>
        </div>
        {bolehKelola ? (
          <Link href="/dashboard/persetujuan/cuti" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
            Persetujuan cuti →
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kartu>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Sisa cuti tahunan</p>
            <p className="font-mono text-2xl font-bold text-navy-800">{sisaCuti} hari</p>
          </KartuIsi>
        </Kartu>
        <Kartu>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Total pengajuan</p>
            <p className="font-mono text-2xl font-bold text-navy-800">{riwayat.length}</p>
          </KartuIsi>
        </Kartu>
        <Kartu>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Menunggu persetujuan</p>
            <p className="font-mono text-2xl font-bold text-navy-800">
              {riwayat.filter((r) => r.status === "menunggu").length}
            </p>
          </KartuIsi>
        </Kartu>
      </div>

      {bolehAjukan ? (
        <Kartu>
          <KartuKepala judul="Ajukan cuti" deskripsi="Lampiran wajib untuk cuti sakit lebih dari 2 hari (serahkan ke admin)." />
          <KartuIsi>
            <FormCuti sisaCuti={sisaCuti} hariIni={tanggalSql(new Date())} />
          </KartuIsi>
        </Kartu>
      ) : null}

      <Kartu>
        <KartuKepala judul="Riwayat pengajuan" />
        {riwayat.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada pengajuan"
            deskripsi="Pengajuan cuti Anda akan tercatat di sini."
            ikon={<CalendarCheck className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Jenis</SelKepala>
                <SelKepala>Periode</SelKepala>
                <SelKepala>Hari</SelKepala>
                <SelKepala>Alasan</SelKepala>
                <SelKepala>Status</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {riwayat.map((r) => {
                const meta = STATUS[r.status];
                const Ikon = meta?.ikon ?? Clock;
                return (
                  <TabelBaris key={r.id}>
                    <Sel className="text-sm">{LABEL_JENIS_CUTI[r.jenisCuti] ?? r.jenisCuti}</Sel>
                    <Sel className="whitespace-nowrap text-xs">
                      {tanggalSedang(r.tanggalMulai)} — {tanggalSedang(r.tanggalSelesai)}
                    </Sel>
                    <Sel className="font-mono text-xs">{r.totalHari}</Sel>
                    <Sel className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{r.alasan}</p>
                      {r.catatanPersetujuan ? (
                        <p className="mt-0.5 text-xs text-navy-500">Catatan: {r.catatanPersetujuan}</p>
                      ) : null}
                    </Sel>
                    <Sel>
                      <Lencana nada={meta?.nada}>
                        <Ikon className="h-3 w-3" aria-hidden />
                        {meta?.label ?? r.status}
                      </Lencana>
                    </Sel>
                  </TabelBaris>
                );
              })}
            </tbody>
          </TabelPembungkus>
        )}
      </Kartu>
    </div>
  );
}
