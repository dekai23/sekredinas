"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";

import { Pesan } from "@/components/ui/dasar";
import { BarisForm, Input, Select, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { LABEL_JENIS_CUTI } from "@/lib/label";
import type { HasilForm } from "@/lib/validasi/konten";

import { ajukanCuti } from "./aksi";

function TombolKirim() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      {pending ? "Mengirim..." : (
        <>
          <Send className="h-4 w-4" aria-hidden />
          Kirim pengajuan
        </>
      )}
    </Tombol>
  );
}

/** Formulir pengajuan cuti (PRD 6.G). */
export function FormCuti({ sisaCuti, hariIni }: { sisaCuti: number; hariIni: string }) {
  const [hasil, kirim] = useActionState<HasilForm | null, FormData>(ajukanCuti, null);

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {hasil?.galat ? <Pesan nada="galat" judul="Pengajuan gagal">{hasil.galat}</Pesan> : null}
      {hasil?.sukses ? <Pesan nada="sukses">{hasil.sukses}</Pesan> : null}

      <Pesan nada="info">
        Sisa cuti tahunan Anda: <strong>{sisaCuti} hari</strong>. Jumlah hari dihitung otomatis
        sebagai hari kerja.
      </Pesan>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarisForm label="Jenis cuti" wajib htmlFor="jenisCuti">
          <Select id="jenisCuti" name="jenisCuti" defaultValue="cuti_annual">
            {Object.entries(LABEL_JENIS_CUTI).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </Select>
        </BarisForm>
        <BarisForm label="Kontak selama cuti" htmlFor="kontak">
          <Input id="kontak" name="kontak" maxLength={50} placeholder="mis. 0812xxxxxxx" />
        </BarisForm>
        <BarisForm label="Tanggal mulai" wajib htmlFor="tanggalMulai" galat={hasil?.field?.tanggalMulai}>
          <Input id="tanggalMulai" name="tanggalMulai" type="date" required defaultValue={hariIni} />
        </BarisForm>
        <BarisForm label="Tanggal selesai" wajib htmlFor="tanggalSelesai" galat={hasil?.field?.tanggalSelesai}>
          <Input id="tanggalSelesai" name="tanggalSelesai" type="date" required defaultValue={hariIni} />
        </BarisForm>
      </div>

      <BarisForm label="Alamat selama cuti" htmlFor="alamatTujuan">
        <Input id="alamatTujuan" name="alamatTujuan" maxLength={200} />
      </BarisForm>

      <BarisForm label="Alasan" wajib htmlFor="alasan" galat={hasil?.field?.alasan}>
        <Textarea id="alasan" name="alasan" required rows={3} maxLength={2000} />
      </BarisForm>

      <div className="border-t border-navy-100 pt-4">
        <TombolKirim />
      </div>
    </form>
  );
}
