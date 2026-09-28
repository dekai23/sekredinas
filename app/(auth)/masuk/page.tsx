import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Lencana } from "@/components/ui/dasar";
import { LOKASI_LOGO } from "@/components/kop/kop-surat";
import { sesiSaatIni } from "@/lib/auth/sesi";
import { tanggalPanjang } from "@/lib/utils";

import { FormMasuk } from "./form-masuk";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ lanjut?: string; sudah?: string; tidak?: string }>;
};

export default async function HalamanMasuk({ searchParams }: Props) {
  // Sudah masuk? langsung ke dashboard.
  const sesi = await sesiSaatIni();
  if (sesi) redirect("/dashboard");

  const { lanjut, sudah, tidak } = await searchParams;
  const tujuan = lanjut && lanjut.startsWith("/") ? lanjut : "/dashboard";

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel kiri: identitas instansi (disembunyikan di layar kecil). */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-800 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-navy-700/60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-teal-500/10"
        />

        <div className="relative flex items-center gap-4">
          <img
            src={LOKASI_LOGO}
            alt="Logo Kabupaten Yahukimo"
            className="h-16 w-16 rounded-lg bg-white/95 p-1 object-contain"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emas-400">
              Pemerintah Kabupaten Yahukimo
            </p>
            <p className="mt-0.5 text-sm leading-snug text-navy-100">
              Badan Kepegawaian dan Pengembangan Sumber Daya Manusia
            </p>
          </div>
        </div>

        <div className="relative space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Sistem Informasi dan Aplikasi Sekretariat
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-navy-100">
            Satu pintu untuk mengelola surat masuk dan keluar, disposisi berantai, arsip
            digital, agenda, serta layanan kepegawaian BKPSDM Kabupaten Yahukimo.
          </p>
        </div>

        <p className="relative text-xs text-navy-200">
          Hak akses diberikan sesuai jabatan. Aktivitas masuk tercatat pada audit log.
        </p>
      </section>

      {/* Panel kanan: formulir masuk. */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <img
              src={LOKASI_LOGO}
              alt="Logo Kabupaten Yahukimo"
              className="h-12 w-12 rounded-lg border border-navy-100 bg-white p-1 object-contain"
            />
            <p className="text-sm font-bold text-navy-800">BKPSDM Yahukimo</p>
          </div>

          <div className="mb-5 text-center">
            <Lencana nada="emas" className="mb-3">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Area terbatas
            </Lencana>
            <h2 className="text-2xl font-bold text-navy-800">Masuk ke Akun Anda</h2>
            <p className="mt-1 text-sm text-navy-500">
              Gunakan email kantor dan sandi yang diberikan admin sistem.
            </p>
          </div>

          {sudah ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {sudah}
            </div>
          ) : null}
          {tidak ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {tidak}
            </div>
          ) : null}

          <FormMasuk lanjut={tujuan} />

          <p className="mt-6 text-center text-xs text-navy-400">
            {tanggalPanjang(new Date())} · Waktu Indonesia Timur (WIT)
          </p>
        </div>
      </section>
    </main>
  );
}
