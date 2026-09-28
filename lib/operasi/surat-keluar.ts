/**
 * Logika bisnis surat keluar (PRD 6.C), dipisahkan dari server action.
 *
 * Nomor surat: {KODE_KATEGORI}/{URUT}/{KODE_UNIT}/{BULAN_ROMAWI}/{TAHUN}
 * Nomor dibuat saat surat PENGAJUKAN persetujuan, bukan saat draf, supaya
 * nomor tidak terbuang untuk surat yang tidak pernah disetujui.
 * Setelah disetujui, surat menjadi immutable (kolom `terkunci`).
 */
import { and, eq } from "drizzle-orm";

import { beriNotifikasi, catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { nomorSuratKeluar } from "@/lib/db/nomor";
import { ATURAN_SURAT_KELUAR, GalatUnggah, simpanBerkas } from "@/lib/unggah";
import {
  galatZod,
  skemaSuratKeluar,
  type HasilForm,
} from "@/lib/validasi/surat";
import { PERAN_PIMPINAN } from "@/lib/auth/hak-akses";

/** Memastikan penandatangan benar-benarç©¿è¡£ï¼Œæ‹¥æœ‰ peran pimpinan (PRD 6.C). */
async function penandatanganSah(id: string): Promise<string | null> {
  const baris = await db
    .select({ nama: schema.pegawai.namaLengkap, peran: schema.pegawai.peran, aktif: schema.pegawai.aktif })
    .from(schema.pegawai)
    .where(eq(schema.pegawai.id, id))
    .limit(1);
  const p = baris[0];
  if (!p || !p.aktif) return null;
  if (!(PERAN_PIMPINAN as readonly string[]).includes(p.peran)) return null;
  return p.nama;
}

export interface HasilBuatSuratKeluar extends HasilForm {
  id?: string;
  nomorSurat?: string;
}

/** Membuat draf surat keluar (belum bernomor). */
export async function buatSuratKeluar(
  userId: string,
  form: FormData,
): Promise<HasilBuatSuratKeluar> {
  const hasil = skemaSuratKeluar.safeParse(
    Object.fromEntries(
      [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
    ),
  );
  if (!hasil.success) {
    return { galat: "Periksa kembali isian formulir.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const penandatangan = await penandatanganSah(data.penandatanganId);
  if (!penandatangan) {
    return {
      field: {
        penandatanganId: "Penandatangan harus pegawai aktif dengan jabatan pimpinan.",
      },
    };
  }

  // Lampiran bersifat opsional.
  const lampiran = form.get("lampiran");
  let unggah: { path: string; namaAsli: string; ukuran: number } | null = null;
  if (lampiran instanceof File && lampiran.size > 0) {
    try {
      unggah = await simpanBerkas(lampiran, ATURAN_SURAT_KELUAR, "surat-keluar");
    } catch (galat) {
      if (galat instanceof GalatUnggah) return { field: { lampiran: galat.message } };
      throw galat;
    }
  }

  const [tersimpan] = await db
    .insert(schema.suratKeluar)
    .values({
      tanggalSurat: data.tanggalSurat,
      unitId: data.unitId,
      tujuan: data.tujuan,
      perihal: data.perihal,
      kategoriId: data.kategoriId,
      sifat: data.sifat,
      isiSurat: data.isiSurat,
      parafUntuk: data.parafUntuk || null,
      penandatanganId: data.penandatanganId,
      fileUrl: unggah?.path ?? null,
      fileName: unggah?.namaAsli ?? null,
      fileSize: unggah?.ukuran ?? null,
      status: "draft",
      createdBy: userId,
    })
    .returning({ id: schema.suratKeluar.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "surat_keluar",
    entitasId: tersimpan.id,
    perubahan: `Draf untuk ${data.tujuan}, penandatangan ${penandatangan}`,
  });

  return { sukses: "Draf surat keluar tersimpan.", id: tersimpan.id };
}


/**
 * Mengajukan surat keluar untuk persetujuan; di sinilah nomor surat dibuat.
 * Status berpindah dari "draft" menjadi "diajukan".
 */
export async function ajukanPersetujuan(
  userId: string,
  id: string,
): Promise<HasilBuatSuratKeluar> {
  const surat = await db
    .select({
      id: schema.suratKeluar.id,
      status: schema.suratKeluar.status,
      terkunci: schema.suratKeluar.terkunci,
      tujuan: schema.suratKeluar.tujuan,
      tanggalSurat: schema.suratKeluar.tanggalSurat,
      penandatanganId: schema.suratKeluar.penandatanganId,
      unitId: schema.suratKeluar.unitId,
      dibuatOleh: schema.pegawai.namaLengkap,
    })
    .from(schema.suratKeluar)
    .innerJoin(schema.pegawai, eq(schema.suratKeluar.createdBy, schema.pegawai.id))
    .where(eq(schema.suratKeluar.id, id))
    .limit(1);

  const baris = surat[0];
  if (!baris) return { galat: "Surat keluar tidak ditemukan." };
  if (baris.terkunci) {
    return { galat: "Surat yang sudah disetujui tidak dapat diajukan kembali." };
  }
  if (baris.status !== "draft") {
    return { galat: "Surat ini sudah diajukan sebelumnya." };
  }

  // Nomor surat memerlukan kode kategori & kode unit penerbit.
  const kategori = await db
    .select({ kode: schema.kategoriSurat.kode })
    .from(schema.suratKeluar)
    .innerJoin(
      schema.kategoriSurat,
      eq(schema.suratKeluar.kategoriId, schema.kategoriSurat.id),
    )
    .where(eq(schema.suratKeluar.id, id))
    .limit(1);
  const unit = baris.unitId
    ? (
        await db
          .select({ kode: schema.unitKerja.kode })
          .from(schema.unitKerja)
          .where(eq(schema.unitKerja.id, baris.unitId))
          .limit(1)
      )[0]
    : null;

  if (!kategori[0] || !unit) {
    return { galat: "Kategori surat atau unit penerbit belum ditentukan." };
  }

  const tanggal = new Date(baris.tanggalSurat);
  const nomorSurat = await nomorSuratKeluar({
    kodeKategori: kategori[0].kode,
    kodeUnit: unit.kode,
    tanggal,
  });

  await db
    .update(schema.suratKeluar)
    .set({ status: "diajukan", nomorSurat, updatedAt: new Date() })
    .where(and(eq(schema.suratKeluar.id, id), eq(schema.suratKeluar.status, "draft")));

  if (baris.penandatanganId) {
    await beriNotifikasi({
      userId: baris.penandatanganId,
      judul: "Surat keluar menunggu persetujuan",
      pesan: `${baris.dibuatOleh} mengajukan surat nomor ${nomorSurat} untuk ditinjau.`,
      tipe: "persetujuan_surat",
      link: "/dashboard/persetujuan/surat",
    });
  }

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "surat_keluar",
    entitasId: id,
    perubahan: `diajukan, nomor ${nomorSurat}`,
  });

  return { sukses: "Surat diajukan untuk persetujuan.", nomorSurat };
}

/**
 * Menyetujui surat keluar. Setelah disetujui surat menjadi immutable
 * (PRD 6.C) dan tidak dapat diedit lagi.
 */
export async function setujuiSurat(
  userId: string,
  id: string,
  catatan: string,
): Promise<HasilBuatSuratKeluar> {
  const surat = await db
    .select({
      status: schema.suratKeluar.status,
      nomorSurat: schema.suratKeluar.nomorSurat,
      pembuat: schema.pegawai.namaLengkap,
    })
    .from(schema.suratKeluar)
    .innerJoin(schema.pegawai, eq(schema.suratKeluar.createdBy, schema.pegawai.id))
    .where(eq(schema.suratKeluar.id, id))
    .limit(1);

  const baris = surat[0];
  if (!baris) return { galat: "Surat keluar tidak ditemukan." };
  if (baris.status !== "diajukan") {
    return { galat: "Hanya surat berstatus menunggu persetujuan yang dapat disetujui." };
  }

  await db
    .update(schema.suratKeluar)
    .set({
      status: "terkirim",
      terkunci: true,
      disetujuiOlehId: userId,
      disetujuiPada: new Date(),
      catatanPersetujuan: catatan || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.suratKeluar.id, id));

  await catatAksi({
    userId,
    aksi: "setujui",
    entitas: "surat_keluar",
    entitasId: id,
    perubahan: `disetujui, nomor ${baris.nomorSurat ?? "-"}`,
  });

  return { sukses: "Surat disetujui dan dikunci." };
}

/** Mengembalikan surat kepada pembuat untuk diperbaiki. */
export async function kembalikanSurat(
  userId: string,
  id: string,
  catatan: string,
): Promise<HasilBuatSuratKeluar> {
  if (!catatan.trim()) {
    return { field: { catatanPersetujuan: "Alasan pengembalian wajib diisi." } };
  }

  const surat = await db
    .select({ status: schema.suratKeluar.status, pembuatId: schema.suratKeluar.createdBy })
    .from(schema.suratKeluar)
    .where(eq(schema.suratKeluar.id, id))
    .limit(1);
  const baris = surat[0];
  if (!baris) return { galat: "Surat keluar tidak ditemukan." };
  if (baris.status !== "diajukan") {
    return { galat: "Hanya surat menunggu persetujuan yang dapat dikembalikan." };
  }

  await db
    .update(schema.suratKeluar)
    .set({
      status: "draft",
      catatanPersetujuan: catatan,
      updatedAt: new Date(),
    })
    .where(eq(schema.suratKeluar.id, id));

  await beriNotifikasi({
    userId: baris.pembuatId,
    judul: "Surat keluar dikembalikan",
    pesan: `Surat Anda dikembalikan untuk diperbaiki. Catatan: ${catatan.slice(0, 120)}`,
    tipe: "persetujuan_surat",
    link: "/dashboard/surat-keluar",
  });

  await catatAksi({
    userId,
    aksi: "tolak",
    entitas: "surat_keluar",
    entitasId: id,
    perubahan: `dikembalikan: ${catatan.slice(0, 120)}`,
  });

  return { sukses: "Surat dikembalikan kepada pembuat." };
}
