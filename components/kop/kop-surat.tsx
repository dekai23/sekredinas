import { cn } from "@/lib/utils";

export const LOKASI_LOGO = "/logo-yahukimo.png";

/**
 * Kop surat resmi BKPSDM.
 *
 * Replikasi dari `kop bkd.docx` (lihat docs/KOP-SURAT.md):
 *  - kertas F4/Folio 21,6 x 33 cm; margin kiri 2,54 cm, kanan 1,84 cm, atas 1,25 cm
 *  - baris 1: PEMERINTAH KABUPATEN YAHUKIMO (Palatino Linotype bold 18pt)
 *  - baris 2-3: BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA (18pt)
 *  - baris 4: alamat (LiSu bold 10pt)
 *  - garis kop: garis ganda (thin-thick) 1,5 pt
 *  - logo melayang di sisi kiri, 2,56 x 2,43 cm
 *
 * Identitas instansi diambil dari tabel pengaturan, bukan ditulis mati,
 * sehingga dapat diubah admin tanpa menyentuh kode.
 */
export function KopSurat({ className }: { className?: string }) {
  return (
    <header className={cn("relative w-full", className)}>
      {/* Logo melayang di sisi kiri kop, tidak mendorong teks. */}
      <div className="absolute left-0 top-0 hidden w-[2.56cm] sm:block">
        <img
          src={LOKASI_LOGO}
          alt="Logo Kabupaten Yahukimo"
          width={102}
          height={97}
          className="h-[2.43cm] w-[2.56cm] object-contain"
        />
      </div>

      {/* Teks kop diberi indentasi kiri agar tidak menimpa logo. */}
      <div className="px-0 text-center sm:pl-[3.1cm]">
        <p
          className="font-bold leading-tight text-navy-950"
          style={{ fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif", fontSize: "18pt" }}
        >
          PEMERINTAH KABUPATEN YAHUKIMO
        </p>
        <p
          className="font-semibold uppercase leading-tight text-navy-900"
          style={{ fontFamily: "'Berlin Sans FB', 'Arial Narrow', Arial, sans-serif", fontSize: "18pt" }}
        >
          Badan Kepegawaian dan Pengembangan
          <br />
          Sumber Daya Manusia
        </p>
        <p
          className="mt-0.5 font-bold text-navy-800"
          style={{ fontFamily: "LiSu, 'Arial Narrow', Arial, sans-serif", fontSize: "10pt" }}
        >
          Komp. Gedung Serba Guna Jl. Kurima - Dekai
        </p>
      </div>

      {/* Garis kop: garis ganda 1,5 pt. */}
      <div
        aria-hidden
        className="mt-1 w-full border-b-[3px] border-double border-navy-950"
      />
    </header>
  );
}
