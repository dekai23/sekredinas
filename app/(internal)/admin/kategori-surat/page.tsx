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

import { hapusKategori } from "./aksi";
import { FormKategori } from "./form-kategori";

export const dynamic = "force-dynamic";

/** Kelola kategori surat beserta kodenya (admin). */
export default async function HalamanKategoriSurat() {
  await wajibRole(["admin"], "admin/kategori-surat");

  const daftar = await db
    .select()
    .from(schema.kategoriSurat)
    .orderBy(asc(schema.kategoriSurat.kode));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Kategori Surat</h1>
        <p className="text-sm text-navy-500">
          {daftar.length} kategori. Kode dipakai untuk membentuk nomor surat keluar.
        </p>
      </div>

      <Kartu>
        <KartuKepala
          judul="Tambah kategori"
          aksi={
            <Lencana nada="emas">
              <Plus className="h-3 w-3" aria-hidden /> Kategori baru
            </Lencana>
          }
        />
        <KartuIsi>
          <FormKategori />
        </KartuIsi>
      </Kartu>

      <Kartu>
        <KartuKepala judul="Daftar kategori" />
        {daftar.length === 0 ? (
          <KeadaanKosong judul="Belum ada kategori" />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Kode</SelKepala>
                <SelKepala>Nama</SelKepala>
                <SelKepala>Uraian</SelKepala>
                <SelKepala>Status</SelKepala>
                <SelKepala>Aksi</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((k) => (
                <TabelBaris key={k.id}>
                  <Sel className="font-mono text-xs font-semibold">{k.kode}</Sel>
                  <Sel className="font-semibold text-navy-800">{k.nama}</Sel>
                  <Sel className="max-w-md text-sm text-navy-600">{k.uraian ?? "-"}</Sel>
                  <Sel>
                    <Lencana nada={k.aktif ? "sukses" : "netral"}>
                      {k.aktif ? "Aktif" : "Nonaktif"}
                    </Lencana>
                  </Sel>
                  <Sel>
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                        <Pencil className="h-3 w-3" aria-hidden /> Ubah
                      </summary>
                      <div className="mt-2 w-[min(80vw,520px)] rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
                        <FormKategori
                          dataAwal={{
                            id: k.id,
                            nama: k.nama,
                            kode: k.kode,
                            uraian: k.uraian ?? "",
                            aktif: k.aktif,
                          }}
                        />
                        <div className="pt-2">
                          <TombolHapus aksi={hapusKategori} id={k.id} konfirmasi={`Hapus kategori ${k.kode}?`} />
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
