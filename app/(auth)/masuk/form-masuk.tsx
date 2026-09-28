"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { LockKeyhole, LogIn, Mail } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";

import { masuk, type HasilMasuk } from "./aksi";

/** Tombol submit yang menampilkan status sibuk selama server action berjalan. */
function TombolMasuk() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" ukuran="penuh" disabled={pending} className="mt-1">
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Memproses...
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" aria-hidden />
          Masuk
        </>
      )}
    </Tombol>
  );
}

export function FormMasuk({ lanjut }: { lanjut: string }) {
  const [hasil, formMasuk] = useActionState<HasilMasuk | null, FormData>(masuk, null);

  return (
    <form action={formMasuk} className="space-y-4" noValidate>
      <input type="hidden" name="lanjut" value={lanjut} />

      {hasil?.galat ? (
        <Pesan nada="galat" judul="Gagal masuk">
          {hasil.galat}
        </Pesan>
      ) : null}

      <BarisForm label="Email kantor" wajib htmlFor="email">
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
            aria-hidden
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="nama@yahukimokab.go.id"
            className="pl-9"
          />
        </div>
      </BarisForm>

      <BarisForm label="Sandi" wajib htmlFor="sandi">
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
            aria-hidden
          />
          <Input
            id="sandi"
            name="sandi"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Sandi Anda"
            className="pl-9"
          />
        </div>
      </BarisForm>

      <TombolMasuk />

      <p className="text-center text-xs text-navy-500">
        <Link href="/lupa-sandi" className="underline hover:text-navy-700">
          Lupa sandi?
        </Link>
        {" · "}
        <Link href="/" className="underline hover:text-navy-700">
          Kembali ke beranda
        </Link>
      </p>
    </form>
  );
}
