"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ItemNav {
  label: string;
  href: string;
}

/**
 * Navigasi portal publik: bilah menu dengan penanda halaman aktif, kolom
 * pencarian cepat, tombol CTA, dan laci geser untuk layar kecil.
 */
export function NavPublik({
  menu,
  masuk,
  hrefMasuk,
}: {
  menu: ItemNav[];
  masuk: boolean;
  hrefMasuk: string;
}) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Menu publik">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            aria-current={aktif(m.href) ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              aktif(m.href)
                ? "bg-biru-50 text-biru-700"
                : "text-navy-600 hover:bg-biru-50/70 hover:text-biru-700",
            )}
          >
            {m.label}
          </Link>
        ))}
      </nav>

      {/* Pencarian ringkas (desktop) */}
      <form action="/berita" method="get" className="relative hidden xl:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          placeholder="Cari informasi..."
          aria-label="Pencarian"
          className="h-10 w-48 rounded-full border border-navy-200 bg-navy-50/60 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 transition focus:border-biru-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-biru-100"
        />
      </form>

      <Link
        href={hrefMasuk}
        target={masuk ? undefined : "_blank"}
        rel={masuk ? undefined : "noopener noreferrer"}
        className="ml-auto hidden items-center gap-2 rounded-full bg-biru-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-biru-600/20 transition-colors hover:bg-biru-700 lg:inline-flex"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {masuk ? "Dashboard" : "Masuk ASN"}
      </Link>

      {/* Tombol menu layar kecil */}
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="ml-auto rounded-xl border border-navy-200 p-2 text-navy-700 transition-colors hover:bg-navy-50 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {buka ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setBuka(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[88vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
              <span className="text-sm font-bold text-navy-800">Menu</span>
              <button
                type="button"
                onClick={() => setBuka(false)}
                className="rounded-lg p-1 text-navy-500 hover:bg-navy-50"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form action="/berita" method="get" className="relative mb-4">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
                  aria-hidden
                />
                <input
                  type="search"
                  name="q"
                  placeholder="Cari informasi..."
                  aria-label="Pencarian"
                  className="h-11 w-full rounded-xl border border-navy-200 bg-navy-50 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-biru-400 focus:bg-white focus:outline-none"
                />
              </form>

              <ul className="space-y-1">
                {menu.map((m) => (
                  <li key={m.href}>
                    <Link
                      href={m.href}
                      onClick={() => setBuka(false)}
                      className={cn(
                        "block rounded-xl px-3 py-2.5 text-sm font-medium",
                        aktif(m.href)
                          ? "bg-biru-50 text-biru-700"
                          : "text-navy-600 hover:bg-navy-50",
                      )}
                    >
                      {m.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={hrefMasuk}
                target={masuk ? undefined : "_blank"}
                rel={masuk ? undefined : "noopener noreferrer"}
                onClick={() => setBuka(false)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-biru-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                {masuk ? "Dashboard" : "Masuk ASN"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
