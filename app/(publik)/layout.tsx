import Link from "next/link";

import { LOKASI_LOGO } from "@/components/kop/kop-surat";
import { sesiSaatIni } from "@/lib/auth/sesi";
import { identitasInstansi } from "@/lib/data/instansi";

const MENU_PUBLIK = [
  { label: "Beranda", href: "/" },
  { label: "Profil Instansi", href: "/profil" },
  { label: "Layanan", href: "/layanan" },
  { label: "Pengumuman", href: "/pengumuman" },
  { label: "Kontak", href: "/kontak" },
];

/** Layout zona publik: header + footer instansi (docs/ARSITEKTUR.md). */
export default async function LayoutPublik({
  children,
}: {
  children: React.ReactNode;
}) {
  const instansi = await identitasInstansi();
  const sesi = await sesiSaatIni();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="cetak-sembunyi border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src={LOKASI_LOGO}
              alt="Logo Kabupaten Yahukimo"
              className="h-11 w-11 shrink-0 rounded-lg border border-navy-100 p-1 object-contain"
            />
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-navy-500">
                Pemerintah Kabupaten Yahukimo
              </span>
              <span className="block truncate text-sm font-bold text-navy-800">
                {instansi.namaSingkat}
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Menu publik">
            {MENU_PUBLIK.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
              >
                {m.label}
              </Link>
            ))}
          </nav>

          <Link
            href={sesi ? "/dashboard" : "/masuk"}
            className="ml-auto rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800 md:ml-3"
          >
            {sesi ? "Dashboard" : "Masuk"}
          </Link>
        </div>

        {/* Menu ringkas untuk layar kecil. */}
        <nav
          className="flex gap-1 overflow-x-auto border-t border-navy-50 px-4 py-2 md:hidden"
          aria-label="Menu publik (ringkas)"
        >
          {MENU_PUBLIK.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50"
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-100 bg-navy-900 text-navy-100">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={LOKASI_LOGO}
                alt="Logo Kabupaten Yahukimo"
                className="h-12 w-12 rounded-lg bg-white/95 p-1 object-contain"
              />
              <p className="text-sm font-bold text-white">{instansi.namaSingkat}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-navy-200">{instansi.namaBadan}</p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-emas-400">Kontak</h2>
            <address className="mt-3 space-y-1 text-sm not-italic text-navy-200">
              <p>{instansi.alamat}</p>
              <p>{instansi.emailKantor}</p>
              {instansi.telepon ? <p>{instansi.telepon}</p> : null}
            </address>
          </div>

          <div>
            <h2 className="text-sm font-bold text-emas-400">Informasi</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {MENU_PUBLIK.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="text-navy-200 hover:text-white">
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 py-4 text-center text-xs text-navy-300">
          &copy; {new Date().getFullYear()} {instansi.pemerintah}. Hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
