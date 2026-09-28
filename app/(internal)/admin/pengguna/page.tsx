import { asc, count, eq } from "drizzle-orm";
import { Download, UserPlus } from "lucide-react";

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
import { Tombol } from "@/components/ui/tombol";
import { boleh, wajibRole } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { tanggalRingkas } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAMA_PERAN: Record<string, string> = {
  kepala_badan: "Kepala Badan",
  sekretaris: "Sekretaris",
  kepala_bidang: "Kepala Bidang",
  kepala_sub_bagian: "Kepala Sub Bagian",
  kepala_sub_bidang: "Kepala Sub Bidang",
  plt_kepala_sub_bidang: "Pl. Kepala Sub Bidang",
  plt_kepala_sub_bagian: "Plt. Kepala Sub Bagian",
  fungsional: "Jabatan Fungsional",
  pelaksana: "Pelaksana",
};

const NAMA_ROLE: Record<string, { label: string; nada: "perhatian" | "teal" | "netral" }> = {
  admin: { label: "Administrator", nada: "perhatian" },
  pimpinan: { label: "Pimpinan", nada: "teal" },
  pegawai: { label: "Pegawai", nada: "netral" },
};

/** Halaman pengelolaan pengguna (hanya admin). */
export default async function HalamanPengguna() {
  const sesi = await wajibRole(["admin"], "admin/pengguna");
  const bolehKelola = boleh(sesi, "pengguna.kelola");

  const [daftar, rekap] = await Promise.all([
    db
      .select({
        id: schema.pegawai.id,
        nip: schema.pegawai.nip,
        nama: schema.pegawai.namaLengkap,
        pangkatGolongan: schema.pegawai.pangkatGolongan,
        jabatan: schema.pegawai.jabatan,
        peran: schema.pegawai.peran,
        role: schema.pegawai.role,
        email: schema.pegawai.email,
        statusPegawai: schema.pegawai.statusPegawai,
        aktif: schema.pegawai.aktif,
        lastLoginAt: schema.pegawai.lastLoginAt,
        unit: schema.unitKerja.nama,
      })
      .from(schema.pegawai)
      .leftJoin(schema.unitKerja, eq(schema.pegawai.unitId, schema.unitKerja.id))
      .orderBy(asc(schema.unitKerja.urutan), asc(schema.pegawai.namaLengkap)),
    db.select({ n: count() }).from(schema.pegawai).where(eq(schema.pegawai.aktif, true)),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Pengguna</h1>
          <p className="text-sm text-navy-500">
            {rekap[0]?.n ?? 0} pegawai aktif. Data bersumber dari DATA PEGAWAI.xlsx dan
            dapat disesuaikan melalui menu Unit Kerja.
          </p>
        </div>
        {bolehKelola ? (
          <div className="flex gap-2">
            <Tombol varian="garis" ukuran="kecil">
              <Download className="h-4 w-4" aria-hidden />
              Ekspor
            </Tombol>
            <Tombol ukuran="kecil">
              <UserPlus className="h-4 w-4" aria-hidden />
              Tambah pengguna
            </Tombol>
          </div>
        ) : null}
      </div>

      <Kartu>
        <KartuKepala
          judul="Daftar pegawai"
          deskripsi="Menampilkan NIP, jabatan, unit kerja, peran jabatan, dan role sistem."
        />
        {daftar.length === 0 ? (
          <KeadaanKosong
            judul="Belum ada data pegawai"
            deskripsi="Jalankan `npm run db:seed` untuk memuat data pegawai dari berkas instansi."
          />
        ) : (
          <TabelPembungkus>
            <TabelKepala>
              <tr>
                <SelKepala>NIP</SelKepala>
                <SelKepala>Nama &amp; Jabatan</SelKepala>
                <SelKepala>Unit Kerja</SelKepala>
                <SelKepala>Peran / Role</SelKepala>
                <SelKepala>Status</SelKepala>
                <SelKepala>Login Terakhir</SelKepala>
              </tr>
            </TabelKepala>
            <tbody>
              {daftar.map((p) => (
                <TabelBaris key={p.id}>
                  <Sel className="font-mono text-xs">{p.nip ?? "-"}</Sel>
                  <Sel>
                    <p className="font-semibold text-navy-800">{p.nama}</p>
                    <p className="text-xs text-navy-500">
                      {p.pangkatGolongan ?? "-"}
                      {p.jabatan ? ` · ${potong(p.jabatan, 70)}` : ""}
                    </p>
                    <p className="text-xs text-navy-400">{p.email}</p>
                  </Sel>
                  <Sel className="text-sm">{p.unit ?? "Tanpa unit"}</Sel>
                  <Sel>
                    <div className="flex flex-wrap gap-1">
                      <Lencana>{NAMA_PERAN[p.peran] ?? p.peran}</Lencana>
                      <Lencana nada={NAMA_ROLE[p.role]?.nada ?? "netral"}>
                        {NAMA_ROLE[p.role]?.label ?? p.role}
                      </Lencana>
                    </div>
                  </Sel>
                  <Sel>
                    <Lencana nada={p.aktif ? "sukses" : "netral"}>
                      {p.aktif ? (p.statusPegawai ?? "Aktif") : "Nonaktif"}
                    </Lencana>
                  </Sel>
                  <Sel className="text-xs text-navy-500">
                    {p.lastLoginAt ? tanggalRingkas(p.lastLoginAt) : "Belum pernah"}
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

/** Memotong teks panjang agar tabel tetap rapi. */
function potong(teks: string, panjang: number): string {
  return teks.length > panjang ? `${teks.slice(0, panjang)}...` : teks;
}
