import { count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ClipboardList } from "lucide-react";
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
import { wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_STATUS_DISPOSISI } from "@/lib/label";
import { tanggalPanjang, tanggalRingkas, tanggalSql } from "@/lib/utils";

import { FormTindakLanjut } from "./form-tindak-lanjut";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tab?: string }> };

/**
 * Kotak masuk disposisi (PRD 6.D).
 * Tab "Masuk" berisi disposisi yang menunggu tindak lanjut pengguna;
 * tab "Kirim" berisi disposisi yang dibuat pengguna (pemantauan pimpinan).
 */
export default async function HalamanDisposisi({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/disposisi");
  const { tab } = await searchParams;
  const mode = tab === "kirim" ? "kirim" : "masuk";

  const penerima = alias(schema.pegawai, "penerima_disposisi");
  const pengirim = alias(schema.pegawai, "pengirim_disposisi");
  const kolom = mode === "masuk" ? schema.disposisi.keUserId : schema.disposisi.dariUserId;

  const daftar = await db
    .select({
      id: schema.disposisi.id,
      keUserId: schema.disposisi.keUserId,
      suratMasukId: schema.disposisi.suratMasukId,
      nomorAgenda: schema.suratMasuk.nomorAgenda,
      perihal: schema.suratMasuk.perihal,
      instruksi: schema.disposisi.instruksi,
      catatan: schema.disposisi.catatan,
      status: schema.disposisi.status,
      batasWaktu: schema.disposisi.batasWaktu,
      selesaiPada: schema.disposisi.selesaiPada,
      level: schema.disposisi.level,
      namaPenerima: penerima.namaLengkap,
      namaPengirim: pengirim.namaLengkap,
    })
    .from(schema.disposisi)
    .innerJoin(schema.suratMasuk, eq(schema.disposisi.suratMasukId, schema.suratMasuk.id))
    .innerJoin(penerima, eq(schema.disposisi.keUserId, penerima.id))
    .innerJoin(pengirim, eq(schema.disposisi.dariUserId, pengirim.id))
    .where(eq(kolom, sesi.id))
    .orderBy(desc(schema.disposisi.createdAt))
    .limit(100);

  const [jumlahMasuk, jumlahKirim] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.disposisi)
      .where(eq(schema.disposisi.keUserId, sesi.id)),
    db
      .select({ n: count() })
      .from(schema.disposisi)
      .where(eq(schema.disposisi.dariUserId, sesi.id)),
  ]);

  const hariIni = tanggalSql(new Date());
  const menunggu = daftar.filter((d) => d.status === "menunggu");
  const terlambat = menunggu.filter((d) => (d.batasWaktu ?? hariIni) < hariIni);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Disposisi</h1>
        <p className="text-sm text-navy-500">
          Disposisi yang menunggu tindak lanjut Anda, serta disposisi yang Anda kirimkan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kartu>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Menunggu tindak lanjut</p>
            <p className="font-mono text-2xl font-bold text-navy-800">{menunggu.length}</p>
          </KartuIsi>
        </Kartu>
        <Kartu className={terlambat.length > 0 ? "border-red-200" : undefined}>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Terlambat</p>
            <p
              className={
                terlambat.length > 0
                  ? "font-mono text-2xl font-bold text-red-600"
                  : "font-mono text-2xl font-bold text-navy-800"
              }
            >
              {terlambat.length}
            </p>
          </KartuIsi>
        </Kartu>
        <Kartu>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Disposisi yang saya kirim</p>
            <p className="font-mono text-2xl font-bold text-navy-800">{jumlahKirim[0]?.n ?? 0}</p>
          </KartuIsi>
        </Kartu>
      </div>

      <div className="flex gap-1 border-b border-navy-100">
        <Link
          href="/dashboard/disposisi?tab=masuk"
          className={
            "border-b-2 px-4 py-2 text-sm font-semibold " +
            (mode === "masuk"
              ? "border-emas-500 text-navy-800"
              : "border-transparent text-navy-500 hover:text-navy-700")
          }
        >
          Masuk ({jumlahMasuk[0]?.n ?? 0})
        </Link>
        <Link
          href="/dashboard/disposisi?tab=kirim"
          className={
            "border-b-2 px-4 py-2 text-sm font-semibold " +
            (mode === "kirim"
              ? "border-emas-500 text-navy-800"
              : "border-transparent text-navy-500 hover:text-navy-700")
          }
        >
          Kirim ({jumlahKirim[0]?.n ?? 0})
        </Link>
      </div>

      <Kartu>
        <KartuKepala
          judul={mode === "masuk" ? "Disposisi masuk" : "Disposisi yang saya kirimkan"}
          deskripsi="Klik nomor surat untuk membuka detail surat."
        />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul={mode === "masuk" ? "Tidak ada disposisi masuk" : "Belum ada disposisi dikirim"}
            deskripsi="Disposisi akan muncul di sini setelah pimpinan memberikan instruksi."
            ikon={<ClipboardList className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Surat</SelKepala>
                <SelKepala>Instruksi</SelKepala>
                <SelKepala>{mode === "masuk" ? "Dari" : "Kepada"}</SelKepala>
                <SelKepala>Batas Waktu</SelKepala>
                <SelKepala>Status</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((d) => {
                const meta = LABEL_STATUS_DISPOSISI[d.status];
                const lewat = (d.batasWaktu ?? hariIni) < hariIni && d.status === "menunggu";
                return (
                  <TabelBaris key={d.id}>
                    <Sel>
                      <Link
                        href={`/dashboard/surat-masuk/${d.suratMasukId}`}
                        className="font-mono text-sm font-semibold text-navy-800 underline-offset-2 hover:underline"
                      >
                        {d.nomorAgenda}
                      </Link>
                      <p className="text-xs text-navy-500">Level {d.level}</p>
                    </Sel>
                    <Sel className="max-w-md">
                      <p className="line-clamp-2 text-sm">{d.instruksi}</p>
                      {d.catatan ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-navy-500">{d.catatan}</p>
                      ) : null}
                    </Sel>
                    <Sel className="text-sm">
                      {mode === "masuk" ? d.namaPengirim : d.namaPenerima}
                    </Sel>
                    <Sel className="whitespace-nowrap text-xs">
                      {tanggalPanjang(d.batasWaktu ?? hariIni)}
                      {d.selesaiPada ? (
                        <span className="block text-navy-400">
                          selesai {tanggalRingkas(d.selesaiPada)}
                        </span>
                      ) : null}
                    </Sel>
                    <Sel>
                      <div className="flex flex-wrap items-center gap-1">
                        <Lencana nada={meta?.nada}>{meta?.label ?? d.status}</Lencana>
                        {lewat ? <Lencana nada="bahaya">Terlambat</Lencana> : null}
                      </div>
                    </Sel>
                  </TabelBaris>
                );
              })}
            </tbody>
          </TabelPembungkus>
        )}
      </Kartu>

      {/* Tindak lanjut hanya untuk disposisi milik pengguna sendiri. */}
      {mode === "masuk"
        ? (() => {
            const milikSaya = daftar.filter(
              (d) => d.keUserId === sesi.id && d.status !== "selesai",
            );
            if (milikSaya.length === 0) return null;
            return (
              <Kartu>
                <KartuKepala
                  judul="Tindak lanjut"
                  deskripsi="Isi catatan hasil pekerjaan lalu tutup disposisi."
                />
                <KartuIsi className="space-y-5">
                  {milikSaya.map((d) => (
                    <div key={d.id} className="cetak-putus border-b border-navy-50 pb-4 last:border-0">
                      <p className="text-xs font-semibold text-navy-500">
                        {d.nomorAgenda} · Level {d.level} · dari {d.namaPengirim}
                      </p>
                      <p className="mb-2 text-sm font-semibold text-navy-800">{d.instruksi}</p>
                      <FormTindakLanjut disposisiId={d.id} />
                    </div>
                  ))}
                </KartuIsi>
              </Kartu>
            );
          })()
        : null}
    </div>
  );
}
