"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import type { HasilForm } from "@/lib/validasi/surat";
import { tambahHariKerja, tanggalSql } from "@/lib/utils";

import { buatDisposisi } from "@/app/(internal)/dashboard/disposisi/aksi";

interface Props {
  suratMasukId: string;
  daftarPenerima: Array<{ id: string; nama: string; unit: string | null }>;
  disposisiAktif: Array<{
    id: string;
    level: number;
    namaPenerima: string;
    keUserId: string;
  }>;
  idPengguna: string;
}

function TombolKirim() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" ukuran="kecil" disabled={pending}>
      {pending ? "Mengirim..." : (
        <>
          <Send className="h-3.5 w-3.5" aria-hidden />
          Kirim disposisi
        </>
      )}
    </Tombol>
  );
}

/** Formulir pemberian disposisi berantai (PRD 6.D). */
export function FormDisposisi({
  suratMasukId,
  daftarPenerima,
  disposisiAktif,
  idPengguna,
}: Props) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(buatDisposisi, null);
  const [penerima, setPenerima] = useState("");

  // Batas waktu default: 2 hari kerja (PRD 6.D).
  const batasDefault = tanggalSql(tambahHariKerja(new Date(), 2));

  // Penerusan hanya dari disposisi milik pengguna sendiri yang masih berjalan.
  const untukPenerusan = disposisiAktif.filter((d) => d.keUserId === idPengguna);

  return (
    <form action={kirim} className="space-y-3" noValidate>
      <input type="hidden" name="suratMasukId" value={suratMasukId} />

      {hasil?.galat ? <Pesan nada="galat">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <BarisForm label="Terahkan kepada" wajib htmlFor="keUserId" galat={hasil?.field?.keUserId}>
          <Select
            id="keUserId"
            name="keUserId"
            required
            value={penerima}
            onChange={(e) => setPenerima(e.target.value)}
          >
            <option value="">-- pilih pegawai --</option>
            {daftarPenerima
              .filter((p) => p.id !== idPengguna)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                  {p.unit ? ` - ${p.unit}` : ""}
                </option>
              ))}
          </Select>
        </BarisForm>

        <BarisForm
          label="Batas waktu"
          htmlFor="batasWaktu"
          petunjuk="Kosongkan untuk memakai batas default 2 hari kerja."
        >
          <Input
            id="batasWaktu"
            name="batasWaktu"
            type="date"
            defaultValue={batasDefault}
          />
        </BarisForm>
      </div>

      {untukPenerusan.length > 0 ? (
        <BarisForm
          label="Penerusan dari disposisi"
          htmlFor="indukId"
          petunjuk="Kosongkan bila ini disposisi pertama untuk surat ini."
        >
          <Select id="indukId" name="indukId" defaultValue="">
            <option value="">-- disposisi baru (level 1) --</option>
            {untukPenerusan.map((d) => (
              <option key={d.id} value={d.id}>
                Level {d.level} - {d.namaPenerima}
              </option>
            ))}
          </Select>
        </BarisForm>
      ) : null}

      <BarisForm label="Instruksi" wajib htmlFor="instruksi" galat={hasil?.field?.instruksi}>
        <Textarea
          id="instruksi"
          name="instruksi"
          required
          rows={2}
          maxLength={2000}
          placeholder="mis. Mohon ditindaklanjuti dan laporkan hasilnya."
        />
      </BarisForm>

      <BarisForm label="Catatan tambahan" htmlFor="catatan">
        <Textarea id="catatan" name="catatan" rows={2} maxLength={1000} />
      </BarisForm>

      <TombolKirim />
    </form>
  );
}
