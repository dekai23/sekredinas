"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ItemNav {
  label: string;
  href: string;
}

/**
 * Navigasi portal publik: menu dengan penanda halaman aktif, tombol CTA, dan
 * laci geser untuk layar kecil.
 */
export function NavPublik({ menu, masuk, hrefMasuk }: { menu: ItemNav[]; masuk: boolean; hrefMasuk: string }) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu publik">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            aria-current={aktif(m.href) ? "page" : undefined}
            className={cn(
              "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              aktif(m.href)
                ? "text-navy-800"
                : "text-navy-600 hover:bg-navy-50 hover:text-navy-800",
            )}
          >
            {m.label}
            {aktif(m.href) ? (
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emas-500" />
            ) : null}
          </Link>
        ))}
      </nav>

      <Link
        href={hrefMasuk}
        target={masuk ? undefined : "_blank"}
        rel={masuk ? undefined : "noopener noreferrer"}
        className="ml-auto hidden items-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800 lg:inline-flex"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {masuk ? "Dashboard" : "Masuk ASN"}
      </Link>

      {/* Tombol menu layar kecil */}
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="ml-auto rounded-lg border border-navy-200 p-2 text-navy-700 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {buka ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setBuka(false)} aria-hidden />
          <div className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
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
            <ul className="space-y-1">
              {menu.map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    onClick={() => setBuka(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium",
                      aktif(m.href)
                        ? "bg-navy-50 text-navy-800"
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
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {masuk ? "Dashboard" : "Masuk ASN"}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
