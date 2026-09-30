import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { LOKASI_LOGO } from "@/components/kop/kop-surat";
import { NavPublik } from "@/components/publik/nav-publik";
import { DaftarSosmed } from "@/components/publik/sosmed";
import { sesiSaatIni } from "@/lib/auth/sesi";
import { identitasInstansi } from "@/lib/data/instansi";

/**
 * Seluruh halaman publik dirender saat diminta (bukan saat build), supaya
 * proses build tidak memerlukan koneksi/tabel database. Penting untuk deploy
 * serverless (Netlify) di mana database baru tersedia saat runtime.
 */
export const dynamic = "force-dynamic";

const MENU_PUBLIK = [
  { label: "Beranda", href: "/" },
  { label: "Profil", href: "/profil" },
  { label: "Layanan", href: "/layanan" },
  { label: "Berita", href: "/berita" },
  { label: "Galeri", href: "/galeri" },
  { label: "Agenda", href: "/agenda" },
  { label: "Pengumuman", href: "/pengumuman" },
  { label: "Kontak", href: "/kontak" },
];

/** Layout zona publik: top bar, header lengket, dan footer instansi. */
export default async function LayoutPublik({
  children,
}: {
  children: React.ReactNode;
}) {
  const instansi = await identitasInstansi();
  const sesi = await sesiSaatIni();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top bar utilitas */}
      <div className="cetak-sembunyi hidden bg-biru-950 text-biru-100 sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6">
          <p className="flex min-w-0 items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-biru-300" aria-hidden />
            <span className="truncate">{instansi.alamat}</span>
            {instansi.emailKantor ? (
              <span className="ml-2 hidden items-center gap-2 lg:flex">
                <Mail className="h-3.5 w-3.5 text-biru-300" aria-hidden />
                {instansi.emailKantor}
              </span>
            ) : null}
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link href="/pengumuman" className="transition-colors hover:text-white">
              Pengumuman
            </Link>
            <span className="h-3 w-px bg-white/20" aria-hidden />
            <Link href="/kontak" className="transition-colors hover:text-white">
              Aduan &amp; Kontak
            </Link>
            <span className="h-3 w-px bg-white/20" aria-hidden />
            <Link
              href={sesi ? "/dashboard" : "/masuk"}
              target={sesi ? undefined : "_blank"}
              rel={sesi ? undefined : "noopener noreferrer"}
              className="font-semibold text-emas-300 transition-colors hover:text-emas-200"
            >
              Masuk ASN
            </Link>
          </div>
        </div>
      </div>

      <header className="cetak-sembunyi sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-biru-50 to-biru-100 p-1.5 ring-1 ring-biru-100">
              <img
                src={LOKASI_LOGO}
                alt="Logo Kabupaten Yahukimo"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-biru-600">
                {instansi.pemerintah}
              </span>
              <span className="block truncate text-sm font-bold text-navy-800 sm:text-base">
                {instansi.namaSingkat}
              </span>
            </span>
          </Link>

          <NavPublik
            menu={MENU_PUBLIK}
            masuk={Boolean(sesi)}
            hrefMasuk={sesi ? "/dashboard" : "/masuk"}
          />
        </div>
        <div
          aria-hidden
          className="h-0.5 w-full bg-gradient-to-r from-biru-500 via-biru-300 to-transparent"
        />
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative overflow-hidden bg-biru-950 text-biru-200">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-biru-400/60 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-biru-500/20 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 p-1.5">
                <img
                  src={LOKASI_LOGO}
                  alt="Logo Kabupaten Yahukimo"
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{instansi.namaSingkat}</p>
                <p className="text-xs text-biru-300">{instansi.pemerintah}</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-biru-300">
              {instansi.namaBadan}. Kami berkomitmen menghadirkan layanan kepegawaian yang
              cepat, transparan, dan dapat diakses seluruh ASN serta masyarakat.
            </p>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emas-300">
                Ikuti kami
              </p>
              <DaftarSosmed
                className="mt-3"
                url={{
                  whatsapp: instansi.sosmedWhatsapp,
                  facebook: instansi.sosmedFacebook,
                  instagram: instansi.sosmedInstagram,
                  x: instansi.sosmedX,
                  youtube: instansi.sosmedYoutube,
                }}
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Jelajahi</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {MENU_PUBLIK.map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className="inline-flex items-center gap-1.5 text-biru-300 transition-colors hover:text-white"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Kontak</h2>
            <address className="mt-3 space-y-2.5 text-sm not-italic text-biru-300">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-biru-400" aria-hidden />
                {instansi.alamat}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-biru-400" aria-hidden />
                {instansi.emailKantor}
              </p>
              {instansi.telepon ? (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-biru-400" aria-hidden />
                  {instansi.telepon}
                </p>
              ) : null}
            </address>
            <p className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-xs text-biru-300 ring-1 ring-white/10">
              Jam layanan: Senin&ndash;Kamis 08.00&ndash;15.00 &middot; Jumat
              08.00&ndash;11.00 WIT
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/10 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-biru-400 sm:flex-row sm:px-6 sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} {instansi.pemerintah}. Hak cipta dilindungi.
            </p>
            <p>{instansi.namaAplikasi}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
