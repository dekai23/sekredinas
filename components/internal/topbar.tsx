import type { SesiPengguna } from "@/lib/auth/sesi";

import { Keluar } from "./keluar";

/** Topbar area internal: judul halaman, nama pengguna, dan tombol keluar. */
export function Topbar({ sesi }: { sesi: SesiPengguna }) {
  return (
    <header className="cetak-sembunyi sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-3 pl-16 sm:px-6 lg:pl-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy-800">{sesi.nama}</p>
          <p className="truncate text-xs text-navy-500">
            {sesi.unit ?? "Tanpa unit kerja"} · {formatPeran(sesi.peran)}
          </p>
        </div>

        <Keluar />
      </div>
    </header>
  );
}

/** Menampilkan peran jabatan dengan kapitalisasi rapi. */
function formatPeran(peran: string): string {
  const kamus: Record<string, string> = {
    kepala_badan: "Kepala Badan",
    sekretaris: "Sekretaris Badan",
    kepala_bidang: "Kepala Bidang",
    kepala_sub_bagian: "Kepala Sub Bagian",
    kepala_sub_bidang: "Kepala Sub Bidang",
    plt_kepala_sub_bidang: "Pl. Kepala Sub Bidang",
    plt_kepala_sub_bagian: "Plt. Kepala Sub Bagian",
    fungsional: "Jabatan Fungsional",
    pelaksana: "Pelaksana",
  };
  return kamus[peran] ?? "Pegawai";
}
