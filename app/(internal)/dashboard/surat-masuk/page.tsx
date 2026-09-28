import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import { Inbox, Plus, Search } from "lucide-react";
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
import { LABEL_SIFAT, LABEL_STATUS_SURAT_MASUK } from "@/lib/label";
import { tanggalSedang } from "@/lib/utils";

export const dynamic = "force-dynamic";

const UKURAN_HALAMAN = 25;

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sifat?: string;
    dari?: string;
    sampai?: string;
    hal?: string;
  }>;
};

/** Daftar surat masuk dengan pencarian & penyaring (PRD 6.B). */
export default async function HalamanSuratMasuk({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/surat-masuk");
  const bolehBuat = boleh(sesi, "surat-masuk.buat");
  const param = await searchParams;

  const halaman = Math.max(1, Number(param.hal ?? "1") || 1);
  const kataKunci = (param.q ?? "").trim();

  /** Syarat WHERE, disusun bertahap dari tiap penyaring. */
  const syarat: SQL[] = [];

  // Surat "rahasia" hanya untuk admin & pimpinan (PRD 6.B).
  if (sesi.role !== "admin" && !boleh(sesi, "surat-keluar.setujui")) {
    syarat.push(ne(schema.suratMasuk.sifat, "rahasia"));
  }
  if (kataKunci) {
    syarat.push(
      or(
        ilike(schema.suratMasuk.asalSurat, `%${kataKunci}%`),
        ilike(schema.suratMasuk.perihal, `%${kataKunci}%`),
        ilike(schema.suratMasuk.nomorSurat, `%${kataKunci}%`),
        ilike(schema.suratMasuk.nomorAgenda, `%${kataKunci}%`),
      )!,
    );
  }
  if (param.status) syarat.push(eq(schema.suratMasuk.status, param.status as never));
  if (param.sifat) syarat.push(eq(schema.suratMasuk.sifat, param.sifat as never));
  if (param.dari) syarat.push(gte(schema.suratMasuk.tanggalTerima, param.dari));
  if (param.sampai) syarat.push(lte(schema.suratMasuk.tanggalTerima, param.sampai));

  const kondisi = syarat.length > 0 ? and(...syarat) : undefined;

  const [total, baris] = await Promise.all([
    db.select({ n: count() }).from(schema.suratMasuk).where(kondisi),
    db
      .select({
        id: schema.suratMasuk.id,
        nomorAgenda: schema.suratMasuk.nomorAgenda,
        nomorSurat: schema.suratMasuk.nomorSurat,
        asalSurat: schema.suratMasuk.asalSurat,
        perihal: schema.suratMasuk.perihal,
        tanggalTerima: schema.suratMasuk.tanggalTerima,
        sifat: schema.suratMasuk.sifat,
        status: schema.suratMasuk.status,
        fileName: schema.suratMasuk.fileName,
      })
      .from(schema.suratMasuk)
      .where(kondisi)
      .orderBy(desc(schema.suratMasuk.tanggalTerima), desc(schema.suratMasuk.createdAt))
      .limit(UKURAN_HALAMAN)
      .offset((halaman - 1) * UKURAN_HALAMAN),
  ]);

  const jumlah = total[0]?.n ?? 0;
  const totalHalaman = Math.max(1, Math.ceil(jumlah / UKURAN_HALAMAN));
  const adaPenyaring = Boolean(
    kataKunci || param.status || param.sifat || param.dari || param.sampai,
  );

  /** Membangun query-string sambil mempertahankan penyaring lain. */
  const tautan = (perubahan: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (kataKunci) p.set("q", kataKunci);
    if (param.status) p.set("status", param.status);
    if (param.sifat) p.set("sifat", param.sifat);
    if (param.dari) p.set("dari", param.dari);
    if (param.sampai) p.set("sampai", param.sampai);
    for (const [kunci, nilai] of Object.entries(perubahan)) {
      if (nilai) p.set(kunci, nilai);
      else p.delete(kunci);
    }
    const qs = p.toString();
    return `/dashboard/surat-masuk${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Surat Masuk</h1>
          <p className="text-sm text-navy-500">
            {jumlah} surat tercatat{adaPenyaring ? " (sesuai penyaring)" : ""}.
          </p>
        </div>
        {bolehBuat ? (
          <Link href="/dashboard/surat-masuk/baru">
            <Tombol ukuran="kecil">
              <Plus className="h-4 w-4" aria-hidden />
              Registrasi surat
            </Tombol>
          </Link>
        ) : null}
      </div>

      {/* Penyaring */}
      <Kartu>
        <form
          method="get"
          className="grid gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="sm:col-span-2">
            <label htmlFor="q" className="sr-only">
              Pencarian
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
                aria-hidden
              />
              <Input
                id="q"
                name="q"
                defaultValue={kataKunci}
                placeholder="Cari asal, perihal, atau nomor..."
                className="pl-9"
              />
            </div>
          </div>

          <Select name="status" defaultValue={param.status ?? ""} aria-label="Status">
            <option value="">Semua status</option>
            {Object.entries(LABEL_STATUS_SURAT_MASUK).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>

          <Select name="sifat" defaultValue={param.sifat ?? ""} aria-label="Sifat">
            <option value="">Semua sifat</option>
            {Object.entries(LABEL_SIFAT).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              name="dari"
              defaultValue={param.dari ?? ""}
              aria-label="Dari tanggal"
            />
            <Input
              type="date"
              name="sampai"
              defaultValue={param.sampai ?? ""}
              aria-label="Sampai tanggal"
            />
            <Tombol type="submit" varian="garis">
              Cari
            </Tombol>
          </div>
        </form>
      </Kartu>

      {/* Tabel surat */}
      <Kartu>
        <KartuKepala
          judul="Daftar surat"
          deskripsi="Klik nomor agenda untuk membuka detail, scan, dan riwayat disposisi."
        />
        {baris.length === 0 ? (
          <KeadaanKosong
            judul={adaPenyaring ? "Tidak ada surat yang cocok" : "Belum ada surat masuk"}
            deskripsi={
              adaPenyaring
                ? "Coba ubah kata kunci atau clearing penyaring."
                : "Mulai dengan mendaftarkan surat yang diterima kantor."
            }
            ikon={<Inbox className="h-8 w-8" aria-hidden />}
            aksi={
              bolehBuat ? (
                <Link href="/dashboard/surat-masuk/baru">
                  <Tombol ukuran="kecil">Registrasi surat</Tombol>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <TabelPembungkus>
              <TabelKepala>
                <tr>
                  <SelKepala>Nomor Agenda</SelKepala>
                  <SelKepala>Asal Surat</SelKepala>
                  <SelKepala>Perihal</SelKepala>
                  <SelKepala>Tanggal Terima</SelKepala>
                  <SelKepala>Sifat</SelKepala>
                  <SelKepala>Status</SelKepala>
                </tr>
              </TabelKepala>
              <tbody>
                {baris.map((s) => {
                  const status = LABEL_STATUS_SURAT_MASUK[s.status];
                  const sifat = LABEL_SIFAT[s.sifat];
                  return (
                    <TabelBaris key={s.id}>
                      <Sel>
                        <Link
                          href={`/dashboard/surat-masuk/${s.id}`}
                          className="font-mono text-sm font-semibold text-navy-800 underline-offset-2 hover:underline"
                        >
                          {s.nomorAgenda}
                        </Link>
                        {s.nomorSurat ? (
                          <p className="text-xs text-navy-400">No. {s.nomorSurat}</p>
                        ) : null}
                      </Sel>
                      <Sel className="max-w-[16rem] truncate">{s.asalSurat}</Sel>
                      <Sel className="max-w-[22rem]">
                        <span className="line-clamp-2">{s.perihal}</span>
                      </Sel>
                      <Sel className="whitespace-nowrap text-xs">
                        {tanggalSedang(s.tanggalTerima)}
                      </Sel>
                      <Sel>
                        <Lencana nada={sifat?.nada}>{sifat?.label ?? s.sifat}</Lencana>
                      </Sel>
                      <Sel>
                        <Lencana nada={status?.nada}>{status?.label ?? s.status}</Lencana>
                      </Sel>
                    </TabelBaris>
                  );
                })}
              </tbody>
            </TabelPembungkus>

            {/* Paginasi 25 baris per halaman (PRD 4.4). */}
            <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm">
              <p className="text-navy-500">
                Halaman {halaman} dari {totalHalaman} Â· total {jumlah} surat
              </p>
              <div className="flex gap-2">
                {halaman > 1 ? (
                  <Link href={tautan({ hal: String(halaman - 1) })}>
                    <Tombol varian="garis" ukuran="kecil">
                      Sebelumnya
                    </Tombol>
                  </Link>
                ) : null}
                {halaman < totalHalaman ? (
                  <Link href={tautan({ hal: String(halaman + 1) })}>
                    <Tombol varian="garis" ukuran="kecil">
                      Berikutnya
                    </Tombol>
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </Kartu>
    </div>
  );
}

