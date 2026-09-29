import Link from "next/link";

import { LOKASI_LOGO } from "@/components/kop/kop-surat";
import { NavPublik } from "@/components/publik/nav-publik";
import { DaftarSosmed } from "@/components/publik/sosmed";
import { sesiSaatIni } from "@/lib/auth/sesi";
import { identitasInstansi } from "@/lib/data/instansi";

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

/** Layout zona publik: header lengket + footer instansi. */
export default async function LayoutPublik({
  children,
}: {
  children: React.ReactNode;
}) {
  const instansi = await identitasInstansi();
  const sesi = await sesiSaatIni();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="h-1 w-full bg-gradient-to-r from-navy-800 via-emas-500 to-teal-500" />

      <header className="cetak-sembunyi sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src={LOKASI_LOGO}
              alt="Logo Kabupaten Yahukimo"
              className="h-11 w-11 shrink-0 rounded-xl border border-navy-100 p-1 object-contain"
            />
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-navy-500">
                {instansi.pemerintah}
              </span>
              <span className="block truncate text-sm font-bold text-navy-800">
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
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative overflow-hidden bg-navy-950 text-navy-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emas-500/60 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src={LOKASI_LOGO}
                alt="Logo Kabupaten Yahukimo"
                className="h-12 w-12 rounded-xl bg-white/95 p-1 object-contain"
              />
              <div>
                <p className="text-sm font-bold text-white">{instansi.namaSingkat}</p>
                <p className="text-xs text-navy-300">{instansi.pemerintah}</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-navy-300">
              {instansi.namaBadan}. Kami berkomitmen menghadirkan layanan kepegawaian yang
              cepat, transparan, dan dapat diakses seluruh ASN serta masyarakat.
            </p>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emas-400">
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
            <h2 className="text-sm font-bold text-emas-400">Kontak</h2>
            <address className="mt-3 space-y-1.5 text-sm not-italic text-navy-300">
              <p>{instansi.alamat}</p>
              <p>{instansi.emailKantor}</p>
              {instansi.telepon ? <p>{instansi.telepon}</p> : null}
            </address>
          </div>

          <div>
            <h2 className="text-sm font-bold text-emas-400">Tautan</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {MENU_PUBLIK.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="text-navy-300 transition-colors hover:text-white">
                    {m.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/masuk"
                  target={sesi ? undefined : "_blank"}
                  rel={sesi ? undefined : "noopener noreferrer"}
                  className="text-navy-300 transition-colors hover:text-white"
                >
                  Masuk ASN
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800/60 py-4 text-center text-xs text-navy-400">
          &copy; {new Date().getFullYear()} {instansi.pemerintah}. Hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
