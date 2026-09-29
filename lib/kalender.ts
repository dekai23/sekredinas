/**
 * Utilitas kalender bulanan sederhana (tanpa dependensi) untuk modul agenda.
 * Semua perhitungan memakai tanggal kalender murni (UTC) agar tidak terpengaruh
 * zona waktu server.
 */

export const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

export interface HariKalender {
  /** `YYYY-MM-DD`, atau string kosong untuk sel kosong. */
  tanggal: string;
  hari: number;
  dalamBulan: boolean;
  iniHariIni: boolean;
}

/** Membangun grid kalender (Senin-Minggu) untuk satu bulan `YYYY-MM`. */
export function bangunKalender(bulan: string, hariIni: string): HariKalender[] {
  const [tahunStr, bulanStr] = bulan.split("-");
  const tahun = Number(tahunStr);
  const bulanIdx = Number(bulanStr) - 1;
  const hariPertama = new Date(Date.UTC(tahun, bulanIdx, 1));
  const offset = (hariPertama.getUTCDay() + 6) % 7;
  const jumlahHari = new Date(Date.UTC(tahun, bulanIdx + 1, 0)).getUTCDate();

  const sel: HariKalender[] = [];
  for (let i = 0; i < offset; i += 1) {
    sel.push({ tanggal: "", hari: 0, dalamBulan: false, iniHariIni: false });
  }
  for (let hari = 1; hari <= jumlahHari; hari += 1) {
    const mm = String(bulanIdx + 1).padStart(2, "0");
    const dd = String(hari).padStart(2, "0");
    const tanggal = `${tahun}-${mm}-${dd}`;
    sel.push({ tanggal, hari, dalamBulan: true, iniHariIni: tanggal === hariIni });
  }
  while (sel.length % 7 !== 0) {
    sel.push({ tanggal: "", hari: 0, dalamBulan: false, iniHariIni: false });
  }
  return sel;
}

/** Menggeser bulan `YYYY-MM` sejumlah delta bulan. */
export function geserBulan(bulan: string, delta: number): string {
  const [tahunStr, bulanStr] = bulan.split("-");
  const d = new Date(Date.UTC(Number(tahunStr), Number(bulanStr) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Label bulan Indonesia, mis. "September 2026". */
export function labelBulan(bulan: string): string {
  return `${NAMA_BULAN[Number(bulan.slice(5, 7)) - 1]} ${bulan.slice(0, 4)}`;
}
