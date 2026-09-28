import { asc, count, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
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
import { LABEL_STATUS_SURAT_KELUAR } from "@/lib/label";
import { tanggalSedang } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Daftar surat keluar yang menunggu persetujuan (PRD 6.C).
 * Hanya pimpinan dan admin yang dapat menyetujui.
 */
export default async function HalamanPersetujuanSurat() {
  const sesi = await wajibMasuk("dashboard/persetujuan/surat");
  const bolehSetujui = boleh(sesi, "surat-keluar.setujui");

  const [jumlah, daftar] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.suratKeluar)
      .where(eq(schema.suratKeluar.status, "diajukan")),
    db
      .select({
        id: schema.suratKeluar.id,
        nomorSurat: schema.suratKeluar.nomorSurat,
        tujuan: schema.suratKeluar.tujuan,
        perihal: schema.suratKeluar.perihal,
        tanggalSurat: schema.suratKeluar.tanggalSurat,
        createdAt: schema.suratKeluar.createdAt,
        status: schema.suratKeluar.status,
        pembuat: schema.pegawai.namaLengkap,
        unit: schema.unitKerja.nama,
      })
      .from(schema.suratKeluar)
      .innerJoin(schema.pegawai, eq(schema.suratKeluar.createdBy, schema.pegawai.id))
      .leftJoin(schema.unitKerja, eq(schema.suratKeluar.unitId, schema.unitKerja.id))
      .where(eq(schema.suratKeluar.status, "diajukan"))
      .orderBy(asc(schema.suratKeluar.tanggalSurat))
      .limit(50),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Persetujuan Surat Keluar</h1>
        <p className="text-sm text-navy-500">
          {jumlah[0]?.n ?? 0} surat menunggu peninjauan. Surat yang disetujui menjadi
          terkunci dan tidak dapat diubah.
        </p>
      </div>

      <Kartu>
        <KartuKepala
          judul="Menunggu persetujuan"
          deskripsi="Buka detail surat untuk membaca naskah lengkap pada kop F4."
        />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Tidak ada surat menunggu"
            deskripsi="Semua surat keluar sudah ditinjau."
            ikon={<CheckCircle2 className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Nomor Surat</SelKepala>
                <SelKepala>Tujuan</SelKepala>
                <SelKepala>Perihal</SelKepala>
                <SelKepala>Diajukan Oleh</SelKepala>
                <SelKepala>Tanggal</SelKepala>
                <SelKepala>Status</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((s) => {
                const meta = LABEL_STATUS_SURAT_KELUAR[s.status];
                return (
                  <TabelBaris key={s.id}>
                    <Sel>
                      <Link
                        href={`/dashboard/surat-keluar/${s.id}`}
                        className="font-mono text-sm font-semibold text-navy-800 underline-offset-2 hover:underline"
                      >
                        {s.nomorSurat ?? "-"}
                      </Link>
                    </Sel>
                    <Sel className="max-w-[16rem] truncate">{s.tujuan}</Sel>
                    <Sel className="max-w-[20rem]">
                      <span className="line-clamp-2">{s.perihal}</span>
                    </Sel>
                    <Sel className="text-sm">
                      {s.pembuat}
                      {s.unit ? (
                        <span className="block text-xs text-navy-400">{s.unit}</span>
                      ) : null}
                    </Sel>
                    <Sel className="whitespace-nowrap text-xs">
                      {tanggalSedang(s.tanggalSurat)}
                    </Sel>
                    <Sel>
                      <Lencana nada={meta?.nada}>{meta?.label ?? s.status}</Lencana>
                    </Sel>
                  </TabelBaris>
                );
              })}
            </tbody>
          </TabelPembungkus>
        )}
      </Kartu>

      {!bolehSetujui ? (
        <Kartu className="border-amber-200 bg-amber-50">
          <KartuIsi className="text-sm text-amber-900">
            Anda dapat melihat daftar ini, tetapi hanya pimpinan atau admin yang dapat
            menyetujui surat keluar.
          </KartuIsi>
        </Kartu>
      ) : null}
    </div>
  );
}



