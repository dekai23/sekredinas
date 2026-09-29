import { and, desc, eq, type SQL } from "drizzle-orm";
import { Globe, Lock, Megaphone, Pencil, Plus } from "lucide-react";
import Link from "next/link";

import { TombolHapus } from "@/components/internal/tombol-hapus";
import { Kartu, KartuIsi, KartuKepala, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_KATEGORI_PENGUMUMAN, LABEL_PRIORITAS } from "@/lib/label";
import { formatWaktuLokal, tanggalPanjang } from "@/lib/utils";

import { hapusPengumuman } from "./aksi";
import { FormPengumuman } from "./form-pengumuman";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ kategori?: string; publik?: string }> };

/** Pengumuman internal & publik: kelola dari satu tempat (PRD 6.H). */
export default async function HalamanPengumuman({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/pengumuman");
  const bolehKelola = boleh(sesi, "pengumuman.kelola");
  const param = await searchParams;

  const syarat: SQL[] = [];
  if (param.kategori) syarat.push(eq(schema.pengumuman.kategori, param.kategori));
  if (param.publik === "1") syarat.push(eq(schema.pengumuman.publik, true));
  if (param.publik === "0") syarat.push(eq(schema.pengumuman.publik, false));
  const kondisi = syarat.length > 0 ? and(...syarat) : undefined;

  const daftar = await db
    .select({
      id: schema.pengumuman.id,
      judul: schema.pengumuman.judul,
      ringkasan: schema.pengumuman.ringkasan,
      isi: schema.pengumuman.isi,
      prioritas: schema.pengumuman.prioritas,
      kategori: schema.pengumuman.kategori,
      internal: schema.pengumuman.internal,
      publik: schema.pengumuman.publik,
      tanggalMulai: schema.pengumuman.tanggalMulai,
      tanggalBerakhir: schema.pengumuman.tanggalBerakhir,
      pembuat: schema.pegawai.namaLengkap,
    })
    .from(schema.pengumuman)
    .leftJoin(schema.pegawai, eq(schema.pengumuman.createdBy, schema.pegawai.id))
    .where(kondisi)
    .orderBy(desc(schema.pengumuman.tanggalMulai));

  const filter = (nilai: string | undefined) =>
    `/dashboard/pengumuman${nilai ? `?${nilai}` : ""}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Pengumuman</h1>
          <p className="text-sm text-navy-500">
            {daftar.length} pengumuman. Tandai <strong>publik</strong> agar tampil di portal.
          </p>
        </div>
      </div>

      {/* Filter */}
      <Kartu>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <Link href={filter(undefined)}>
            <Lencana nada={!param.kategori && !param.publik ? "gelap" : "netral"}>Semua</Lencana>
          </Link>
          <Link href={filter("publik=1")}>
            <Lencana nada={param.publik === "1" ? "gelap" : "netral"}>Tayang publik</Lencana>
          </Link>
          <Link href={filter("publik=0")}>
            <Lencana nada={param.publik === "0" ? "gelap" : "netral"}>Internal saja</Lencana>
          </Link>
          {Object.entries(LABEL_KATEGORI_PENGUMUMAN).map(([nilai, label]) => (
            <Link key={nilai} href={filter(`kategori=${nilai}`)}>
              <Lencana nada={param.kategori === nilai ? "gelap" : "netral"}>{label}</Lencana>
            </Link>
          ))}
        </div>
      </Kartu>

      {/* Terbitkan */}
      {bolehKelola ? (
        <Kartu>
          <KartuKepala
            judul="Terbitkan pengumuman"
            aksi={
              <Lencana nada="emas">
                <Plus className="h-3 w-3" aria-hidden /> Baru
              </Lencana>
            }
          />
          <KartuIsi>
            <FormPengumuman />
          </KartuIsi>
        </Kartu>
      ) : null}

      {/* Daftar */}
      {daftar.length === 0 ? (
        <Kartu>
          <KeadaanKosong
            judul="Belum ada pengumuman"
            deskripsi="Pengumuman yang diterbitkan akan tampil di sini."
            ikon={<Megaphone className="h-8 w-8" aria-hidden />}
          />
        </Kartu>
      ) : (
        <div className="space-y-3">
          {daftar.map((p) => (
            <Kartu key={p.id}>
              <KartuIsi>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-navy-800">{p.judul}</h2>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {tanggalPanjang(p.tanggalMulai)}
                      {p.pembuat ? ` · ${p.pembuat}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Lencana nada={LABEL_PRIORITAS[p.prioritas]?.nada}>
                      {LABEL_PRIORITAS[p.prioritas]?.label ?? p.prioritas}
                    </Lencana>
                    <Lencana>{LABEL_KATEGORI_PENGUMUMAN[p.kategori] ?? p.kategori}</Lencana>
                    {p.publik ? (
                      <Lencana nada="sukses">
                        <Globe className="h-3 w-3" aria-hidden /> Publik
                      </Lencana>
                    ) : null}
                    {p.internal ? (
                      <Lencana nada="teal">
                        <Lock className="h-3 w-3" aria-hidden /> Internal
                      </Lencana>
                    ) : null}
                  </div>
                </div>

                {p.ringkasan ? (
                  <p className="mt-2 text-sm text-navy-600">{p.ringkasan}</p>
                ) : null}
                <p className="mt-2 line-clamp-3 text-sm text-navy-700">{p.isi}</p>

                {p.tanggalBerakhir ? (
                  <p className="mt-1 text-xs text-navy-400">
                    Berakhir {tanggalPanjang(p.tanggalBerakhir)}
                  </p>
                ) : null}

                {bolehKelola ? (
                  <div className="mt-3 border-t border-navy-50 pt-2">
                    <details>
                      <summary className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy-600">
                        <Pencil className="h-3 w-3" aria-hidden /> Ubah
                      </summary>
                      <div className="pt-3">
                        <FormPengumuman
                          dataAwal={{
                            id: p.id,
                            judul: p.judul,
                            ringkasan: p.ringkasan ?? "",
                            isi: p.isi,
                            prioritas: p.prioritas,
                            kategori: p.kategori,
                            internal: p.internal,
                            publik: p.publik,
                            tanggalMulai: formatWaktuLokal(p.tanggalMulai).slice(0, 10),
                            tanggalBerakhir: p.tanggalBerakhir
                              ? formatWaktuLokal(p.tanggalBerakhir).slice(0, 10)
                              : "",
                          }}
                        />
                        <div className="pt-2">
                          <TombolHapus
                            aksi={hapusPengumuman}
                            id={p.id}
                            konfirmasi={`Hapus pengumuman "${p.judul}"?`}
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                ) : null}
              </KartuIsi>
            </Kartu>
          ))}
        </div>
      )}
    </div>
  );
}
