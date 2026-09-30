"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  CalendarDays,
  ClipboardList,
  Clock,
  FileOutput,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Menu,
  Newspaper,
  Package,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { LOKASI_LOGO } from "@/components/kop/kop-surat";
import { cn } from "@/lib/utils";
import type { SesiPengguna } from "@/lib/auth/sesi";

import type { GrupMenu, NamaIkon } from "./menu";

/** Pemetaan nama ikon (data di server) -> komponen lucide (dipakai di klien). */
const IKON_MENU: Record<NamaIkon, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  inbox: Inbox,
  "file-output": FileOutput,
  "clipboard-list": ClipboardList,
  archive: Archive,
  "calendar-days": CalendarDays,
  clock: Clock,
  megaphone: Megaphone,
  newspaper: Newspaper,
  package: Package,
  "file-text": FileText,
  gauge: Gauge,
  users: Users,
  settings: Settings,
};

const LEBAR = "w-sidebar";

/** Sidebar area internal: 260 px (PRD 4.3), dapat dibuka di layar sempit. */
export function Sidebar({ menu, sesi }: { menu: GrupMenu[]; sesi: SesiPengguna }) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  const isiSidebar = (
    <div className="flex h-full flex-col bg-navy-800 text-navy-100">
      <div className="flex items-center gap-3 border-b border-navy-700 px-4 py-4">
        <img
          src={LOKASI_LOGO}
          alt="Logo Kabupaten Yahukimo"
          className="h-10 w-10 rounded-lg bg-white/95 p-1 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">BKPSDM Yahukimo</p>
          <p className="truncate text-[11px] text-navy-200">Kabupaten Yahukimo</p>
        </div>
        <button
          type="button"
          onClick={() => setBuka(false)}
          className="ml-auto rounded p-1 text-navy-200 hover:bg-navy-700 lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu utama">
        {menu.map((grup) => (
          <div key={grup.judul} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-navy-300">
              {grup.judul}
            </p>
            <ul className="space-y-0.5">
              {grup.item.map((item) => {
                const aktif =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                const Ikon = IKON_MENU[item.ikon] ?? LayoutDashboard;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setBuka(false)}
                      aria-current={aktif ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        aktif
                          ? "bg-emas-500 font-semibold text-navy-900"
                          : "text-navy-100 hover:bg-navy-700",
                      )}
                    >
                      <Ikon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-navy-700 px-4 py-3 text-[11px] text-navy-300">
        <p className="flex items-center gap-1.5">
          <Shield className="h-3 w-3" aria-hidden />
          {sesi.role === "admin"
            ? "Administrator"
            : sesi.role === "pimpinan"
              ? "Pimpinan"
              : "Pegawai"}
        </p>
        <p className="mt-1 font-mono">{sesi.nip ?? "-"}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Tombol pembuka pada layar kecil. */}
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="cetak-sembunyi fixed left-4 top-4 z-30 rounded-lg border border-navy-200 bg-white p-2 shadow-sm lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5 text-navy-700" />
      </button>

      {/* Sidebar tetap di layar besar. */}
      <aside className={cn("cetak-sembunyi fixed inset-y-0 left-0 z-40 hidden lg:block", LEBAR)}>
        {isiSidebar}
      </aside>

      {/* Sidebar geser pada layar kecil. */}
      {buka ? (
        <div className="cetak-sembunyi fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/50"
            onClick={() => setBuka(false)}
            aria-hidden
          />
          <div className={cn("absolute inset-y-0 left-0 shadow-xl", LEBAR)}>{isiSidebar}</div>
        </div>
      ) : null}
    </>
  );
}
