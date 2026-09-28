"use client";

import { useTransition } from "react";

import { Tombol } from "@/components/ui/tombol";
import { ubahStatusSuratMasuk } from "@/app/(internal)/dashboard/surat-masuk/aksi";

/** Tombol kecil untuk mengubah status surat masuk (PRD 6.B). */
export function TombolUbahStatus({
  id,
  status,
  label,
}: {
  id: string;
  status: "dibaca" | "selesai" | "arsip";
  label: string;
}) {
  const [sibuk, mulai] = useTransition();

  return (
    <Tombol
      varian="garis"
      ukuran="kecil"
      disabled={sibuk}
      onClick={() => mulai(() => ubahStatusSuratMasuk(id, status))}
    >
      {sibuk ? "..." : label}
    </Tombol>
  );
}
