import { asc } from "drizzle-orm";
import { Eye, EyeOff, FileText, Pencil, Plus } from "lucide-react";
import Link from "next/link";

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
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { daftarUnitKerja } from "@/lib/data/instansi";
import { db, schema } from "@/lib/db";
import { dariDaftarJson } from "@/lib/operasi/layanan";

import { hapusLayanan } from "./aksi";
import { FormLayanan } from "./form-layanan";

export const dynamic = "force-dynamic";

/** Kelola layanan kepegawaian publik (admin). */
export default async function HalamanLayananInternal() {
  const sesi = await wajibMasuk("dashboard/layanan");
  if (!boleh(sesi, "layanan.kelola")) {
    return (
      <Kartu>
        <KartuIsi className="text-sm text-navy-600">Anda tidak berwenang mengelola layanan.</KartuIsi>
      </Kartu>
    );
  }

  const [daftar, unit] = await Promise.all([
    db
      .select({
        id: schema.layanan.id,
        judul: schema.layanan.judul,
        slug: schema.layanan.slug,
        ringkasan: schema.layanan.ringkasan,
        deskripsi: schema.layanan.deskripsi,
        syarat: schema.layanan.syarat,
        alur: schema.layanan.alur,
        waktuPenyelesaian: schema.layanan.waktuPenyelesaian,
        dasarHukum: schema.layanan.dasarHukum,
        unitId: schema.layanan.unitId,
        urutan: schema.layanan.urutan,
        publik: schema.layanan.publik,
      })
      .from(schema.layanan)
      .orderBy(asc(schema.layanan.urutan), asc(schema.layanan.judul)),
    daftarUnitKerja(),
  ]);

  const unitUntukForm = unit.map((u) => ({ id: u.id, nama: u.nama }));
  const namaUnit = (id: string | null) => unit.find((u) => u.id === id)?.nama ?? "-";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Layanan Kepegawaian</h1>
          <p className="text-sm text-navy-500">
            {daftar.length} layanan. Yang publik tayang di halaman `/layanan`.
          </p>
        </div>
        <Link href="/layanan" target="_blank" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Lihat halaman publik →
        </Link>
      </div>

      <Kartu>
        <KartuKepala
          judul="Tambah layanan"
          aksi={
            <Lencana nada="emas">
              <Plus className="h-3 w-3" aria-hidden /> Layanan baru
            </Lencana>
          }
        />
        <KartuIsi>
          <FormLayanan unit={unitUntukForm} />
        </KartuIsi>
      </Kartu>

      <Kartu>
        <KartuKepala judul="Daftar layanan" />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada layanan"
            deskripsi="Layanan yang ditambahkan akan tampil di sini."
            ikon={<FileText className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Judul</SelKepala>
                <SelKepala>Waktu</SelKepala>
                <SelKepala>Unit</SelKepala>
                <SelKepala>Status</SelKepala>
                <SelKepala>Aksi</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((l) => (
                <TabelBaris key={l.id}>
                  <Sel className="max-w-[24rem]">
                    <p className="font-semibold text-navy-800">{l.judul}</p>
                    <p className="truncate font-mono text-xs text-navy-400">/{l.slug}</p>
                    {l.ringkasan ? (
                      <p className="line-clamp-1 text-xs text-navy-500">{l.ringkasan}</p>
                    ) : null}
                  </Sel>
                  <Sel className="text-sm">{l.waktuPenyelesaian ?? "-"}</Sel>
                  <Sel className="text-sm">{namaUnit(l.unitId)}</Sel>
                  <Sel>
                    <Lencana nada={l.publik ? "sukses" : "netral"}>
                      {l.publik ? (
                        <>
                          <Eye className="h-3 w-3" aria-hidden /> Publik
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" aria-hidden /> Draf
                        </>
                      )}
                    </Lencana>
                  </Sel>
                  <Sel>
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                        <Pencil className="h-3 w-3" aria-hidden /> Ubah
                      </summary>
                      <div className="mt-2 w-[min(85vw,640px)] rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
                        <FormLayanan
                          unit={unitUntukForm}
                          dataAwal={{
                            id: l.id,
                            judul: l.judul,
                            slug: l.slug,
                            ringkasan: l.ringkasan ?? "",
                            deskripsi: l.deskripsi,
                            syarat: dariDaftarJson(l.syarat),
                            alur: dariDaftarJson(l.alur),
                            waktuPenyelesaian: l.waktuPenyelesaian ?? "",
                            dasarHukum: l.dasarHukum ?? "",
                            unitId: l.unitId ?? "",
                            urutan: String(l.urutan),
                            publik: l.publik,
                          }}
                        />
                        <div className="pt-2">
                          <TombolHapus aksi={hapusLayanan} id={l.id} konfirmasi={`Hapus layanan "${l.judul}"?`} />
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
