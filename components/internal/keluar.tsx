"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { keluar } from "@/app/(auth)/keluar/aksi";

/** Tombol keluar pada topbar. */
export function Keluar() {
  return <TombolKeluar />;
}

function TombolKeluar() {
  const { pending } = useFormStatus();
  return (
    <form action={keluar}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-navy-200 px-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </form>
  );
}
