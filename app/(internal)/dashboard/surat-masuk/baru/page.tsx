import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { Kartu, KartuIsi, KartuKepala } from "@/components/ui/dasar";
import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { tanggalSql } from "@/lib/utils";

import { FormSuratMasuk } from "./form-surat-masuk";

export const dynamic = "force-dynamic";

/** Halaman registrasi surat masuk baru (PRD 6.B). */
export default async function HalamanSuratMasukBaru() {
  const sesi = await wajibMasuk("dashboard/surat-masuk/baru");
  if (!boleh(sesi, "surat-masuk.buat")) {
    redirect("/dashboard/surat-masuk?galat=tidak-berwenang");
  }

  const kategori = await db
    .select({ id: schema.kategoriSurat.id, nama: schema.kategoriSurat.nama })
    .from(schema.kategoriSurat)
    .where(eq(schema.kategoriSurat.aktif, true))
    .orderBy(asc(schema.kategoriSurat.nama));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Registrasi Surat Masuk</h1>
        <p className="text-sm text-navy-500">
          Setelah disimpan, sistem membuat nomor agenda otomatis dengan format
          SM-&#123;TAHUN&#125;-&#123;URUT&#125; dan menyimpan scan surat.
        </p>
      </div>

      <Kartu>
        <KartuKepala
          judul="Data surat"
          deskripsi="Isi asal surat, perihal, tanggal, dan sifat, lalu unggah berkas scan PDF."
        />
        <KartuIsi>
          <FormSuratMasuk kategori={kategori} hariIni={tanggalSql(new Date())} />
        </KartuIsi>
      </Kartu>
    </div>
  );
}