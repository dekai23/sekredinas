import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Pencil, Plus, Package, Search } from "lucide-react";

import { TombolHapus } from "@/components/internal/tombol-hapus";
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
import { Input, Select } from "@/components/ui/formulir";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_KONDISI_ASET } from "@/lib/label";
import { rupiah } from "@/lib/utils";

import { hapusInventaris } from "./aksi";
import { FormInventaris } from "./form-inventaris";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; kategori?: string; kondisi?: string }> };

/** Inventaris aset dinas (PRD 6.I). */
export default async function HalamanInventaris({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/inventaris");
  const bolehKelola = boleh(sesi, "inventaris.kelola");
  const param = await searchParams;
  const kataKunci = (param.q ?? "").trim();

  const syarat: SQL[] = [];
  if (kataKunci) {
    syarat.push(
      or(
        ilike(schema.inventaris.namaAset, `%${kataKunci}%`),
        ilike(schema.inventaris.kodeAset, `%${kataKunci}%`),
        ilike(schema.inventaris.merek, `%${kataKunci}%`),
      )!,
    );
  }
  if (param.kategori) syarat.push(eq(schema.inventaris.kategori, param.kategori));
  if (param.kondisi) syarat.push(eq(schema.inventaris.kondisi, param.kondisi as never));
  const kondisi = syarat.length > 0 ? and(...syarat) : undefined;

  const [daftar, kategoriTersedia, pegawai, semua] = await Promise.all([
    db
      .select({
        id: schema.inventaris.id,
        kodeAset: schema.inventaris.kodeAset,
        namaAset: schema.inventaris.namaAset,
        kategori: schema.inventaris.kategori,
        merek: schema.inventaris.merek,
        tahunPerolehan: schema.inventaris.tahunPerolehan,
        jumlah: schema.inventaris.jumlah,
        satuan: schema.inventaris.satuan,
        kondisi: schema.inventaris.kondisi,
        lokasi: schema.inventaris.lokasi,
        nilaiPerolehan: schema.inventaris.nilaiPerolehan,
        nomorPolisi: schema.inventaris.nomorPolisi,
        nomorBmn: schema.inventaris.nomorBmn,
        sumberDana: schema.inventaris.sumberDana,
        penanggungJawabId: schema.inventaris.penanggungJawabId,
        penanggungJawab: schema.pegawai.namaLengkap,
      })
      .from(schema.inventaris)
      .leftJoin(schema.pegawai, eq(schema.inventaris.penanggungJawabId, schema.pegawai.id))
      .where(kondisi)
      .orderBy(asc(schema.inventaris.kategori), asc(schema.inventaris.kodeAset)),
    db.selectDistinct({ kategori: schema.inventaris.kategori }).from(schema.inventaris).orderBy(asc(schema.inventaris.kategori)),
    db
      .select({ id: schema.pegawai.id, nama: schema.pegawai.namaLengkap })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.aktif, true))
      .orderBy(asc(schema.pegawai.namaLengkap)),
    db
      .select({ nilai: schema.inventaris.nilaiPerolehan, jumlah: schema.inventaris.jumlah })
      .from(schema.inventaris),
  ]);

  const totalNilai = semua.reduce((t, a) => t + (a.nilai ?? 0) * (a.jumlah ?? 1), 0);
  const totalUnit = semua.reduce((t, a) => t + (a.jumlah ?? 1), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Inventaris Aset</h1>
          <p className="text-sm text-navy-500">
            {semua.length} jenis aset · {totalUnit} unit · nilai {rupiah(totalNilai)}.
          </p>
        </div>
      </div>

      {/* Penyaring */}
      <Kartu>
        <form method="get" className="grid gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
            <Input name="q" defaultValue={kataKunci} placeholder="Cari nama, kode, atau merek..." className="pl-9" aria-label="Pencarian aset" />
          </div>
          <Select name="kategori" defaultValue={param.kategori ?? ""} aria-label="Kategori">
            <option value="">Semua kategori</option>
            {kategoriTersedia.map((k) => (
              <option key={k.kategori} value={k.kategori}>
                {k.kategori}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Select name="kondisi" defaultValue={param.kondisi ?? ""} aria-label="Kondisi">
              <option value="">Semua kondisi</option>
              {Object.entries(LABEL_KONDISI_ASET).map(([nilai, meta]) => (
                <option key={nilai} value={nilai}>
                  {meta.label}
                </option>
              ))}
            </Select>
            <button type="submit" className="h-10 shrink-0 rounded-lg border border-navy-200 bg-white px-4 text-sm font-semibold text-navy-700 hover:bg-navy-50">
              Cari
            </button>
          </div>
        </form>
      </Kartu>

      {bolehKelola ? (
        <Kartu>
          <KartuKepala
            judul="Tambah aset"
            aksi={
              <Lencana nada="emas">
                <Plus className="h-3 w-3" aria-hidden /> Kode aset otomatis
              </Lencana>
            }
          />
          <KartuIsi>
            <FormInventaris pegawai={pegawai} />
          </KartuIsi>
        </Kartu>
      ) : null}

      <Kartu>
        <KartuKepala judul="Daftar aset" deskripsi="Kode aset, kondisi, lokasi, dan penanggung jawab." />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada aset"
            deskripsi="Data inventaris aset akan tampil di sini."
            ikon={<Package className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Kode</SelKepala>
                <SelKepala>Nama Aset</SelKepala>
                <SelKepala>Kategori</SelKepala>
                <SelKepala>Jumlah</SelKepala>
                <SelKepala>Kondisi</SelKepala>
                <SelKepala>Lokasi</SelKepala>
                <SelKepala>Nilai</SelKepala>
                {bolehKelola ? <SelKepala>Aksi</SelKepala> : null}
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((a) => (
                <TabelBaris key={a.id}>
                  <Sel className="whitespace-nowrap font-mono text-xs">{a.kodeAset}</Sel>
                  <Sel>
                    <p className="font-semibold text-navy-800">{a.namaAset}</p>
                    <p className="text-xs text-navy-500">
                      {a.merek ?? "-"}
                      {a.tahunPerolehan ? ` · ${a.tahunPerolehan}` : ""}
                      {a.penanggungJawab ? ` · PJ: ${a.penanggungJawab}` : ""}
                    </p>
                  </Sel>
                  <Sel className="text-sm">{a.kategori}</Sel>
                  <Sel className="font-mono text-xs">
                    {a.jumlah} {a.satuan}
                  </Sel>
                  <Sel>
                    <Lencana nada={LABEL_KONDISI_ASET[a.kondisi]?.nada}>
                      {LABEL_KONDISI_ASET[a.kondisi]?.label ?? a.kondisi}
                    </Lencana>
                  </Sel>
                  <Sel className="text-sm">{a.lokasi ?? "-"}</Sel>
                  <Sel className="whitespace-nowrap text-xs">{rupiah(a.nilaiPerolehan)}</Sel>
                  {bolehKelola ? (
                    <Sel>
                      <details>
                        <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                          <Pencil className="h-3 w-3" aria-hidden /> Ubah
                        </summary>
                        <div className="mt-2 w-[min(80vw,560px)] rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
                          <FormInventaris
                            pegawai={pegawai}
                            dataAwal={{
                              id: a.id,
                              namaAset: a.namaAset,
                              kategori: a.kategori,
                              merek: a.merek ?? "",
                              tahunPerolehan: a.tahunPerolehan ? String(a.tahunPerolehan) : "",
                              jumlah: String(a.jumlah),
                              satuan: a.satuan,
                              kondisi: a.kondisi,
                              lokasi: a.lokasi ?? "",
                              nilaiPerolehan: a.nilaiPerolehan ? String(a.nilaiPerolehan) : "",
                              nomorPolisi: a.nomorPolisi ?? "",
                              nomorBmn: a.nomorBmn ?? "",
                              sumberDana: a.sumberDana ?? "",
                              penanggungJawabId: a.penanggungJawabId ?? "",
                            }}
                          />
                          <div className="pt-2">
                            <TombolHapus aksi={hapusInventaris} id={a.id} konfirmasi={`Hapus aset ${a.kodeAset}?`} />
                          </div>
                        </div>
                      </details>
                    </Sel>
                  ) : null}
                </TabelBaris>
              ))}
            </tbody>
          </TabelPembungkus>
        )}
      </Kartu>
    </div>
  );
}
