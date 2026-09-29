import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { GelombangNavy } from "@/components/publik/ilustrasi";
import { Kartu, KartuIsi, KartuKepala, Lencana } from "@/components/ui/dasar";
import { identitasInstansi } from "@/lib/data/instansi";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Alamat, jam layanan, dan kontak Badan Kepegawaian dan Pengembangan Sumber Daya " +
    "Manusia Kabupaten Yahukimo.",
};

const JAM_LAYANAN = [
  { hari: "Senin - Kamis", jam: "08.00 - 15.00 WIT" },
  { hari: "Jumat", jam: "08.00 - 11.00 WIT" },
  { hari: "Sabtu - Minggu", jam: "Libur" },
];

/** Halaman kontak: alamat, jam layanan, dan peta lokasi sederhana. */
export default async function HalamanKontak() {
  const instansi = await identitasInstansi();

  return (
    <div>
      <section className="relative overflow-hidden">
        <GelombangNavy className="absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <Lencana nada="emas">Kontak</Lencana>
          <h1 className="mt-3 text-3xl font-bold text-white">Hubungi Kami</h1>
          <p className="mt-2 text-sm text-navy-100">
            Saran, masukan, atau pertanyaan mengenai layanan kepegawaian dapat
            disampaikan melalui alamat berikut.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Kartu>
            <KartuIsi>
              <MapPin className="h-5 w-5 text-navy-400" aria-hidden />
              <p className="mt-2 text-xs font-semibold text-navy-500">Alamat</p>
              <p className="mt-1 text-sm text-navy-800">{instansi.alamat}</p>
            </KartuIsi>
          </Kartu>
          <Kartu>
            <KartuIsi>
              <Mail className="h-5 w-5 text-navy-400" aria-hidden />
              <p className="mt-2 text-xs font-semibold text-navy-500">Email</p>
              <p className="mt-1 text-sm text-navy-800">{instansi.emailKantor}</p>
            </KartuIsi>
          </Kartu>
          <Kartu>
            <KartuIsi>
              <Phone className="h-5 w-5 text-navy-400" aria-hidden />
              <p className="mt-2 text-xs font-semibold text-navy-500">Telepon</p>
              <p className="mt-1 text-sm text-navy-800">
                {instansi.telepon || "Belum diisi"}
              </p>
            </KartuIsi>
          </Kartu>
        </div>

        <Kartu>
          <KartuKepala
            judul="Jam layanan"
            deskripsi="Waktu Indonesia Timur (WIT), sama dengan waktu Dekai."
          />
          <KartuIsi className="space-y-2">
            {JAM_LAYANAN.map((j) => (
              <div
                key={j.hari}
                className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-navy-700">
                  <Clock className="h-4 w-4 text-navy-400" aria-hidden />
                  {j.hari}
                </span>
                <span className="font-mono text-navy-800">{j.jam}</span>
              </div>
            ))}
          </KartuIsi>
        </Kartu>

        <Kartu>
          <KartuKepala judul="Lokasi" deskripsi={instansi.alamat} />
          <KartuIsi>
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-navy-200 bg-navy-50 text-center">
              <p className="px-6 text-sm text-navy-500">
                Peta lokasi akan ditambahkan setelah alamat koordinat dikonfirmasi.
                <br />
                Sementara ini lokasi berada di {instansi.alamat}.
              </p>
            </div>
          </KartuIsi>
        </Kartu>
      </section>
    </div>
  );
}