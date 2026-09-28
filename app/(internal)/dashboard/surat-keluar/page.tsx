import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { FileOutput, Plus } from "lucide-react";
import Link from "next/link";

import {
  Kartu,
  KartuKepala,
  KeadaanKosong,
  Lencana,
  Sel,
  SelKepala,
  TabelBaris,
  TabelKepala,
  TabelPembungkus,
} from "@/components/ui/dasar";
import { Input, Select } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_STATUS_SURAT_KELUAR } from "@/lib/label";
import { tanggalSedang } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

/** Daftar surat keluar dengan pencarian (PRD 6.C). */
export default async function HalamanSuratKeluar({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/surat-keluar");
  const param = await searchParams;
  const bolehBuat = boleh(sesi, "surat-keluar.buat");

  const syarat: SQL[] = [];
  if (param.q) {
    syarat.push(
      or(
        ilike(schema.suratKeluar.tujuan, `%${param.q}%`),
        ilike(schema.suratKeluar.perihal, `%${param.q}%`),
        ilike(schema.suratKeluar.nomorSurat, `%${param.q}%`),
      )!,
    );
  }
  if (param.status) syarat.push(eq(schema.suratKeluar.status, param.status as never));
  const kondisi = syarat.length > 0 ? and(...syarat) : undefined;

  const [total, baris] = await Promise.all([
    db.select({ n: count() }).from(schema.suratKeluar).where(kondisi),
    db
      .select({
        id: schema.suratKeluar.id,
        nomorSurat: schema.suratKeluar.nomorSurat,
        tujuan: schema.suratKeluar.tujuan,
        perihal: schema.suratKeluar.perihal,
        tanggalSurat: schema.suratKeluar.tanggalSurat,
        status: schema.suratKeluar.status,
        terkunci: schema.suratKeluar.terkunci,
        unit: schema.unitKerja.nama,
      })
      .from(schema.suratKeluar)
      .leftJoin(schema.unitKerja, eq(schema.suratKeluar.unitId, schema.unitKerja.id))
      .where(kondisi)
      .orderBy(desc(schema.suratKeluar.createdAt))
      .limit(50),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Surat Keluar</h1>
          <p className="text-sm text-navy-500">
            {total[0]?.n ?? 0} surat. Nomor surat diberikan otomatis saat pengajuan
            persetujuan.
          </p>
        </div>
        {bolehBuat ? (
          <Link href="/dashboard/surat-keluar/baru">
            <Tombol ukuran="kecil">
              <Plus className="h-4 w-4" aria-hidden />
              Susun surat
            </Tombol>
          </Link>
        ) : null}
      </div>

      <Kartu>
        <form method="get" className="flex gap-2 px-4 py-3">
          <Input
            name="q"
            defaultValue={param.q ?? ""}
            placeholder="Cari nomor, tujuan, atau perihal..."
            aria-label="Pencarian"
          />
          <Select name="status" defaultValue={param.status ?? ""} aria-label="Status" className="max-w-[220px]">
            <option value="">Semua status</option>
            {Object.entries(LABEL_STATUS_SURAT_KELUAR).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>
          <Tombol type="submit" varian="garis">
            Cari
          </Tombol>
        </form>
      </Kartu>

      <Kartu>
        <KartuKepala judul="Daftar surat keluar" />
        {baris.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada surat keluar"
            deskripsi="Susun surat keluar dan ajukan untuk memperoleh nomor surat."
            ikon={<FileOutput className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Nomor Surat</SelKepala>
                <SelKepala>Tujuan</SelKepala>
                <SelKepala>Perihal</SelKepala>
                <SelKepala>Unit</SelKepala>
                <SelKepala>Tanggal</SelKepala>
                <SelKepala>Status</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {baris.map((s) => {
                const meta = LABEL_STATUS_SURAT_KELUAR[s.status];
                return (
                  <TabelBaris key={s.id}>
                    <Sel>
                      <Link
                        href={`/dashboard/surat-keluar/${s.id}`}
                        className="font-mono text-sm font-semibold text-navy-800 underline-offset-2 hover:underline"
                      >
                        {s.nomorSurat ?? "Belum bernomor"}
                      </Link>
                      {s.terkunci ? (
                        <span className="block text-[10px] text-navy-400">terkunci</span>
                      ) : null}
                    </Sel>
                    <Sel className="max-w-[16rem] truncate">{s.tujuan}</Sel>
                    <Sel className="max-w-[20rem]">
                      <span className="line-clamp-2">{s.perihal}</span>
                    </Sel>
                    <Sel className="text-sm">{s.unit ?? "-"}</Sel>
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
    </div>
  );
}




