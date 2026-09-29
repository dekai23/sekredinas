import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { CalendarClock, Plus, Search, ShieldAlert } from "lucide-react";
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
import { Input, Select } from "@/components/ui/formulir";
import { adalahPengelolaAbsensi, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_STATUS_ABSENSI } from "@/lib/label";
import { formatWaktuLokal, tanggalPanjang, tanggalSql } from "@/lib/utils";

import { hapusAbsensi } from "./aksi";
import { FormAbsensi } from "./form-absensi";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tanggal?: string; q?: string; status?: string; unit?: string }>;
};

/** Absensi (presensi) ASN harian - Admin & Kasubbag Umum dan Kepegawaian. */
export default async function HalamanAbsensi({ searchParams }: Props) {
  const sesi = await wajibMasuk("dashboard/absensi");

  if (!adalahPengelolaAbsensi(sesi)) {
    return (
      <div className="mx-auto max-w-xl">
        <Kartu className="border-red-200">
          <KartuIsi className="text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden />
            <h1 className="mt-2 text-lg font-bold text-navy-800">Akses dibatasi</h1>
            <p className="mt-1 text-sm text-navy-600">
              Modul absensi hanya dapat dibuka oleh Administrator serta Kepala Sub Bagian
              Umum dan Kepegawaian.
            </p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Lencana nada="bahaya">Kembali ke dashboard</Lencana>
            </Link>
          </KartuIsi>
        </Kartu>
      </div>
    );
  }

  const param = await searchParams;
  const hariIni = tanggalSql(new Date());
  const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(param.tanggal ?? "") ? param.tanggal! : hariIni;
  const kataKunci = (param.q ?? "").trim();

  const syarat: SQL[] = [eq(schema.absensi.tanggal, tanggal)];
  if (param.status) syarat.push(eq(schema.absensi.status, param.status as never));
  if (kataKunci) {
    syarat.push(
      or(
        ilike(schema.pegawai.namaLengkap, `%${kataKunci}%`),
        ilike(schema.pegawai.nip, `%${kataKunci}%`),
      )!,
    );
  }
  if (param.unit) syarat.push(eq(schema.pegawai.unitId, param.unit));

  const [daftar, pegawaiAktif, unit] = await Promise.all([
    db
      .select({
        id: schema.absensi.id,
        pegawaiId: schema.absensi.pegawaiId,
        tanggal: schema.absensi.tanggal,
        jamMasuk: schema.absensi.jamMasuk,
        jamPulang: schema.absensi.jamPulang,
        status: schema.absensi.status,
        keterangan: schema.absensi.keterangan,
        nama: schema.pegawai.namaLengkap,
        nip: schema.pegawai.nip,
        unit: schema.unitKerja.nama,
      })
      .from(schema.absensi)
      .innerJoin(schema.pegawai, eq(schema.absensi.pegawaiId, schema.pegawai.id))
      .leftJoin(schema.unitKerja, eq(schema.pegawai.unitId, schema.unitKerja.id))
      .where(and(...syarat))
      .orderBy(asc(schema.pegawai.namaLengkap)),
    db
      .select({ id: schema.pegawai.id, nama: schema.pegawai.namaLengkap, nip: schema.pegawai.nip, unitId: schema.pegawai.unitId })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.aktif, true))
      .orderBy(asc(schema.pegawai.namaLengkap)),
    db
      .select({ id: schema.unitKerja.id, nama: schema.unitKerja.nama })
      .from(schema.unitKerja)
      .orderBy(asc(schema.unitKerja.urutan)),
  ]);

  const rekap = Object.keys(LABEL_STATUS_ABSENSI).map((status) => ({
    status,
    jumlah: daftar.filter((d) => d.status === status).length,
  }));
  const tercatat = daftar.length;
  const belumTercatat = Math.max(0, pegawaiAktif.length - tercatat);

  const pegawaiUntukForm = pegawaiAktif.map((p) => ({
    id: p.id,
    nama: p.nama,
    nip: p.nip,
    unit: unit.find((u) => u.id === p.unitId)?.nama ?? null,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Absensi ASN</h1>
          <p className="text-sm text-navy-500">
            Catatan kehadiran harian · {tanggalPanjang(tanggal)} · {tercatat} dari{" "}
            {pegawaiAktif.length} pegawai aktif tercatat.
          </p>
        </div>
      </div>

      {/* Ringkasan status */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kartu>
          <KartuIsi>
            <p className="text-xs font-medium text-navy-500">Belum dicatat</p>
            <p className={"font-mono text-2xl font-bold " + (belumTercatat > 0 ? "text-red-600" : "text-navy-800")}>
              {belumTercatat}
            </p>
          </KartuIsi>
        </Kartu>
        {rekap.map((r) => (
          <Kartu key={r.status}>
            <KartuIsi>
              <p className="text-xs font-medium text-navy-500">
                {LABEL_STATUS_ABSENSI[r.status]?.label ?? r.status}
              </p>
              <p className="font-mono text-2xl font-bold text-navy-800">{r.jumlah}</p>
            </KartuIsi>
          </Kartu>
        ))}
      </div>

      {/* Penyaring */}
      <Kartu>
        <form method="get" className="grid gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
            <Input name="q" defaultValue={kataKunci} placeholder="Cari nama atau NIP..." className="pl-9" aria-label="Pencarian absensi" />
          </div>
          <Input type="date" name="tanggal" defaultValue={tanggal} aria-label="Tanggal" />
          <Select name="status" defaultValue={param.status ?? ""} aria-label="Status">
            <option value="">Semua status</option>
            {Object.entries(LABEL_STATUS_ABSENSI).map(([nilai, meta]) => (
              <option key={nilai} value={nilai}>
                {meta.label}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Select name="unit" defaultValue={param.unit ?? ""} aria-label="Unit kerja">
              <option value="">Semua unit</option>
              {unit.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama}
                </option>
              ))}
            </Select>
            <TombolCari />
          </div>
        </form>
      </Kartu>

      {/* Form tambah */}
      <Kartu>
        <KartuKepala
          judul="Catat absensi"
          deskripsi="Pilih pegawai, status kehadiran, dan jam (opsional)."
          aksi={
            <Lencana nada="emas">
              <Plus className="h-3 w-3" aria-hidden /> Entri baru
            </Lencana>
          }
        />
        <KartuIsi>
          <FormAbsensi pegawai={pegawaiUntukForm} hariIni={hariIni} />
        </KartuIsi>
      </Kartu>

      {/* Daftar */}
      <Kartu>
        <KartuKepala
          judul="Daftar absensi"
          deskripsi={`Catatan untuk ${tanggalPanjang(tanggal)}.`}
        />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada catatan"
            deskripsi="Belum ada absensi tercatat untuk penyaring ini."
            ikon={<CalendarClock className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>Nama / NIP</SelKepala>
                <SelKepala>Unit Kerja</SelKepala>
                <SelKepala>Jam Masuk</SelKepala>
                <SelKepala>Jam Pulang</SelKepala>
                <SelKepala>Status</SelKepala>
                <SelKepala>Keterangan</SelKepala>
                <SelKepala>Aksi</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((a) => (
                <TabelBaris key={a.id}>
                  <Sel>
                    <p className="font-semibold text-navy-800">{a.nama}</p>
                    <p className="font-mono text-xs text-navy-500">{a.nip ?? "-"}</p>
                  </Sel>
                  <Sel className="text-sm">{a.unit ?? "-"}</Sel>
                  <Sel className="font-mono text-xs">
                    {a.jamMasuk ? formatWaktuLokal(a.jamMasuk).slice(11, 16) : "-"}
                  </Sel>
                  <Sel className="font-mono text-xs">
                    {a.jamPulang ? formatWaktuLokal(a.jamPulang).slice(11, 16) : "-"}
                  </Sel>
                  <Sel>
                    <Lencana nada={LABEL_STATUS_ABSENSI[a.status]?.nada}>
                      {LABEL_STATUS_ABSENSI[a.status]?.label ?? a.status}
                    </Lencana>
                  </Sel>
                  <Sel className="max-w-xs text-sm text-navy-600">{a.keterangan ?? "-"}</Sel>
                  <Sel>
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-navy-600">Ubah</summary>
                      <div className="mt-2 w-[min(80vw,560px)] rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
                        <FormAbsensi
                          pegawai={pegawaiUntukForm}
                          hariIni={hariIni}
                          dataAwal={{
                            id: a.id,
                            pegawaiId: a.pegawaiId,
                            tanggal: a.tanggal,
                            status: a.status,
                            jamMasuk: a.jamMasuk ? formatWaktuLokal(a.jamMasuk).slice(11, 16) : "",
                            jamPulang: a.jamPulang ? formatWaktuLokal(a.jamPulang).slice(11, 16) : "",
                            keterangan: a.keterangan ?? "",
                          }}
                        />
                        <div className="pt-2">
                          <TombolHapus aksi={hapusAbsensi} id={a.id} konfirmasi={`Hapus absensi ${a.nama} (${a.tanggal})?`} />
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

/** Tombol cari sederhana (server-rendered, tanpa JS). */
function TombolCari() {
  return (
    <button
      type="submit"
      className="h-10 shrink-0 rounded-lg border border-navy-200 bg-white px-4 text-sm font-semibold text-navy-700 hover:bg-navy-50"
    >
      Cari
    </button>
  );
}
