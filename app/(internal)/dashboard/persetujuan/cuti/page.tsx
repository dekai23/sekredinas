import { desc, eq } from "drizzle-orm";
import { ClipboardCheck } from "lucide-react";

import { Kartu, KartuKepala, KeadaanKosong, Lencana } from "@/components/ui/dasar";
import { wajibRole } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { LABEL_JENIS_CUTI } from "@/lib/label";
import { tanggalSedang } from "@/lib/utils";

import { KontrolPersetujuan } from "./tombol-persetujuan";

export const dynamic = "force-dynamic";

/** Persetujuan pengajuan cuti pegawai (PRD 6.G, area pimpinan). */
export default async function HalamanPersetujuanCuti() {
  await wajibRole(["admin", "pimpinan"], "dashboard/persetujuan/cuti");

  const daftar = await db
    .select({
      id: schema.cuti.id,
      nama: schema.pegawai.namaLengkap,
      nip: schema.pegawai.nip,
      jenisCuti: schema.cuti.jenisCuti,
      tanggalMulai: schema.cuti.tanggalMulai,
      tanggalSelesai: schema.cuti.tanggalSelesai,
      totalHari: schema.cuti.totalHari,
      alasan: schema.cuti.alasan,
      alamatTujuan: schema.cuti.alamatTujuan,
      kontak: schema.cuti.kontak,
      status: schema.cuti.status,
      catatanPersetujuan: schema.cuti.catatanPersetujuan,
    })
    .from(schema.cuti)
    .innerJoin(schema.pegawai, eq(schema.cuti.pegawaiId, schema.pegawai.id))
    .orderBy(desc(schema.cuti.createdAt));

  const menunggu = daftar.filter((d) => d.status === "menunggu");
  const selesai = daftar.filter((d) => d.status !== "menunggu");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Persetujuan Cuti</h1>
        <p className="text-sm text-navy-500">
          {menunggu.length} pengajuan menunggu tindakan Anda.
        </p>
      </div>

      <Kartu>
        <KartuKepala judul="Menunggu persetujuan" deskripsi="Tinjau pengajuan lalu setujui atau tolak dengan catatan." />
        {menunggu.length === 0 ? (
          <KeadaanKosong
            judul="Tidak ada pengajuan menunggu"
            deskripsi="Semua pengajuan cuti sudah diproses."
            ikon={<ClipboardCheck className="h-8 w-8" aria-hidden />}
          />
        ) : (
          <ul className="divide-y divide-navy-50">
            {menunggu.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy-800">
                      {c.nama} <span className="font-mono text-xs text-navy-400">{c.nip ?? ""}</span>
                    </p>
                    <p className="text-sm text-navy-600">
                      {LABEL_JENIS_CUTI[c.jenisCuti] ?? c.jenisCuti} · {c.totalHari} hari
                    </p>
                    <p className="text-xs text-navy-500">
                      {tanggalSedang(c.tanggalMulai)} — {tanggalSedang(c.tanggalSelesai)}
                      {c.kontak ? ` · ${c.kontak}` : ""}
                    </p>
                    {c.alamatTujuan ? (
                      <p className="text-xs text-navy-500">Alamat: {c.alamatTujuan}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-navy-700">{c.alasan}</p>
                  </div>
                  <Lencana nada="perhatian">Menunggu</Lencana>
                </div>
                <KontrolPersetujuan id={c.id} />
              </li>
            ))}
          </ul>
        )}
      </Kartu>

      <Kartu>
        <KartuKepala judul="Riwayat keputusan" />
        {selesai.length === 0 ? (
          <KeadaanKosong judul="Belum ada keputusan" />
        ) : (
          <ul className="divide-y divide-navy-50">
            {selesai.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{c.nama}</p>
                  <p className="text-xs text-navy-500">
                    {LABEL_JENIS_CUTI[c.jenisCuti] ?? c.jenisCuti} · {c.totalHari} hari ·{" "}
                    {tanggalSedang(c.tanggalMulai)} — {tanggalSedang(c.tanggalSelesai)}
                  </p>
                  {c.catatanPersetujuan ? (
                    <p className="text-xs text-navy-500">Catatan: {c.catatanPersetujuan}</p>
                  ) : null}
                </div>
                <Lencana nada={c.status === "disetujui" ? "sukses" : "bahaya"}>
                  {c.status === "disetujui" ? "Disetujui" : "Ditolak"}
                </Lencana>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
