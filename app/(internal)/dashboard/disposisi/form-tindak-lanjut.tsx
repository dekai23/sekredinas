"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/surat";

import { selesaikanDisposisi } from "./aksi";

function TombolTutup() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" varian="aksen" ukuran="kecil" disabled={pending}>
      {pending ? (
        "Menyimpan..."
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Tandai selesai
        </>
      )}
    </Tombol>
  );
}

/** Formulir tindak lanjut untuk menutup disposisi (PRD 6.D). */
export function FormTindakLanjut({ disposisiId }: { disposisiId: string }) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(
    selesaikanDisposisi,
    null,
  );

  return (
    <form action={kirim} className="space-y-2">
      <input type="hidden" name="disposisiId" value={disposisiId} />
      {hasil?.galat ? <Pesan nada="galat">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}
      <BarisForm label="Catatan tindak lanjut" wajib htmlFor={`catatan-${disposisiId}`}>
        <Textarea
          id={`catatan-${disposisiId}`}
          name="catatan"
          required
          rows={2}
          maxLength={2000}
          placeholder="Tuliskan hasil tindak lanjut Anda"
        />
      </BarisForm>
      <TombolTutup />
    </form>
  );
}

