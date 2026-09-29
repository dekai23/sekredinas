import { asc } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";

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
import { wajibRole } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_JENIS_UNIT } from "@/lib/label";

import { hapusUnitKerja } from "./aksi";
import { FormUnitKerja } from "./form-unit";

export const dynamic = "force-dynamic";

/** Kelola unit kerja / struktur organisasi (admin). */
export default async function HalamanUnitKerja() {
  await wajibRole(["admin"], "admin/unit-kerja");

  const unit = await db
    .select()
    .from(schema.unitKerja)
    .orderBy(asc(schema.unitKerja.urutan), asc(schema.unitKerja.nama));

  const namaInduk = (u: { indukPemkab: boolean; indukId: string | null }) => {
    if (u.indukPemkab) return "Pemerintah Kabupaten Yahukimo";
    return u.indukId ? (unit.find((x) => x.id === u.indukId)?.nama ?? "-") : "-";
  };

  const opsi = unit.map((u) => ({ id: u.id, nama: u.nama, kode: u.kode }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Unit Kerja</h1>
        <p className="text-sm text-navy-500">
          {unit.length} unit. Struktur ini tampil di halaman profil publik dan dipakai pada nomor surat.
        </p>
      </div>

      <Kartu>
        <KartuKepala
          judul="Tambah unit kerja"
          aksi={
            <Lencana nada="emas">
              <Plus className="h-3 w-3" aria-hidden /> Unit baru
            </Lencana>
          }
        />
        <KartuIsi>
          <FormUnitKerja unit={opsi} />
        </KartuIsi>
      </Kartu>

      <Kartu>
        <KartuKepala judul="Daftar unit kerja" />
        {unit.length === 0 ? (
          <KeadaanKosong judul="Belum ada unit kerja" deskripsi="Jalankan seed atau tambah unit secara manual." />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Kode</SelKepala>
                <SelKepala>Nama</SelKepala>
                <SelKepala>Jenis</SelKepala>
                <SelKepala>Induk</SelKepala>
                <SelKepala>Eselon</SelKepala>
                <SelKepala>Publik</SelKepala>
                <SelKepala>Aksi</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {unit.map((u) => (
                <TabelBaris key={u.id}>
                  <Sel className="whitespace-nowrap font-mono text-xs">{u.kode}</Sel>
                  <Sel className="font-semibold text-navy-800">{u.nama}</Sel>
                  <Sel className="text-sm">{LABEL_JENIS_UNIT[u.jenis] ?? u.jenis}</Sel>
                  <Sel className="text-sm">{namaInduk(u)}</Sel>
                  <Sel className="text-xs">{u.pejabatEselon ?? "-"}</Sel>
                  <Sel>
                    <Lencana nada={u.publik ? "sukses" : "netral"}>
                      {u.publik ? "Tampil" : "Tersembunyi"}
                    </Lencana>
                  </Sel>
                  <Sel>
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                        <Pencil className="h-3 w-3" aria-hidden /> Ubah
                      </summary>
                      <div className="mt-2 w-[min(80vw,560px)] rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
                        <FormUnitKerja
                          unit={opsi}
                          dataAwal={{
                            id: u.id,
                            nama: u.nama,
                            kode: u.kode,
                            jenis: u.jenis,
                            indukId: u.indukId ?? "",
                            indukPemkab: u.indukPemkab,
                            urutan: String(u.urutan),
                            pejabatEselon: u.pejabatEselon ?? "",
                            publik: u.publik,
                          }}
                        />
                        <div className="pt-2">
                          <TombolHapus aksi={hapusUnitKerja} id={u.id} konfirmasi={`Hapus unit ${u.kode}?`} />
                        </div>
                      </div>
                    </details>
                  </Sel>
                </TabelBaris>
              ))}
            </tbody>
          </TabelPembungkus>
        )}
      </Kartu>
    </div>
  );
}
