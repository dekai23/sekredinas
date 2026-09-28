/**
 * Logika bisnis disposisi berantai (PRD 6.D), dipisahkan dari server action.
 *
 * Berisi seluruh aturan: kewenangan, validasi penerima, level rantai, batas
 * waktu default, perubahan status surat, notifikasi, dan audit log.
 */
import { and, eq } from "drizzle-orm";

import { beriNotifikasi, catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { tanggalSql, tambahHariKerja } from "@/lib/utils";
import {
  formKeObjek,
  galatZod,
  skemaDisposisi,
  skemaTindakLanjut,
  type HasilForm,
} from "@/lib/validasi/surat";

export interface AktorDisposisi {
  id: string;
  nama: string;
  /** True bilaæ— æƒ membuat disposisi (pimpinan atau admin). */
  bolehDisposisi: boolean;
  /** True bila pengguna adalah admin. */
  admin: boolean;
}

/**
 * Membuat disposisi baru atau meneruskan disposisi yang ada.
 * Mengembalikan pesan sukses atau galat per-field.
 */
export async function buatDisposisi(
  aktor: AktorDisposisi,
  form: FormData,
): Promise<HasilForm> {
  if (!aktor.bolehDisposisi) {
    return { galat: "Hanya pimpinan atau admin yang dapat memberi disposisi." };
  }

  const hasil = skemaDisposisi.safeParse(formKeObjek(form));
  if (!hasil.success) {
    return { galat: "Periksa kembali isian disposisi.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  if (data.keUserId === aktor.id) {
    return { field: { keUserId: "Tidak dapat mendisposisikan surat kepada diri sendiri." } };
  }

  const penerima = await db
    .select({ nama: schema.pegawai.namaLengkap })
    .from(schema.pegawai)
    .where(and(eq(schema.pegawai.id, data.keUserId), eq(schema.pegawai.aktif, true)))
    .limit(1);
  if (penerima.length === 0) {
    return { field: { keUserId: "Penerima disposisi tidak ditemukan atau tidak aktif." } };
  }

  const surat = await db
    .select({ nomorAgenda: schema.suratMasuk.nomorAgenda })
    .from(schema.suratMasuk)
    .where(eq(schema.suratMasuk.id, data.suratMasukId))
    .limit(1);
  if (surat.length === 0) {
    return { galat: "Surat masuk tidak ditemukan." };
  }

  // Level rantai: 1 untuk disposisi pertama, +1 untuk penerusan.
  let level = 1;
  if (data.indukId) {
    const induk = await db
      .select({ level: schema.disposisi.level })
      .from(schema.disposisi)
      .where(eq(schema.disposisi.id, data.indukId))
      .limit(1);
    if (induk.length === 0) return { galat: "Disposisi asal tidak ditemukan." };
    level = induk[0].level + 1;
  }

  // Batas waktu default 2 hari kerja (PRD 6.D).
  const batasWaktu = data.batasWaktu || tanggalSql(tambahHariKerja(new Date(), 2));


  const [tersimpan] = await db
    .insert(schema.disposisi)
    .values({
      suratMasukId: data.suratMasukId,
      dariUserId: aktor.id,
      keUserId: data.keUserId,
      instruksi: data.instruksi,
      catatan: data.catatan || null,
      level,
      indukId: data.indukId || null,
      batasWaktu,
      status: "menunggu",
    })
    .returning({ id: schema.disposisi.id });

  await db
    .update(schema.suratMasuk)
    .set({ status: "didisposisi", disposisiOlehId: aktor.id, updatedAt: new Date() })
    .where(eq(schema.suratMasuk.id, data.suratMasukId));

  await beriNotifikasi({
    userId: data.keUserId,
    judul: "Disposisi baru",
    pesan:
      `${aktor.nama} mendisposisikan surat ${surat[0].nomorAgenda} kepada Anda. ` +
      `Batas waktu: ${batasWaktu}.`,
    tipe: "disposisi",
    link: "/dashboard/disposisi",
  });

  await catatAksi({
    userId: aktor.id,
    aksi: "disposisi",
    entitas: "disposisi",
    entitasId: tersimpan.id,
    perubahan: `ke ${penerima[0].nama} (level ${level}, batas ${batasWaktu})`,
  });

  return {
    sukses: `Disposisi untuk ${penerima[0].nama} berhasil dibuat (level ${level}).`,
  };
}

/**
 * Menandai disposisi selesai dengan catatan tindak lanjut.
 * Hanya penerima disposisi (atau admin) yang boleh menutupnya.
 */
export async function selesaikanDisposisi(
  aktor: AktorDisposisi,
  form: FormData,
): Promise<HasilForm> {
  const hasil = skemaTindakLanjut.safeParse(formKeObjek(form));
  if (!hasil.success) {
    return { galat: "Lengkapi catatan tindak lanjut.", field: galatZod(hasil.error) };
  }
  const { disposisiId, catatan } = hasil.data;

  const baris = await db
    .select({
      keUserId: schema.disposisi.keUserId,
      dariUserId: schema.disposisi.dariUserId,
      status: schema.disposisi.status,
      instruksi: schema.disposisi.instruksi,
      suratMasukId: schema.disposisi.suratMasukId,
    })
    .from(schema.disposisi)
    .where(eq(schema.disposisi.id, disposisiId))
    .limit(1);
  if (baris.length === 0) return { galat: "Disposisi tidak ditemukan." };
  const disposisi = baris[0];

  if (disposisi.keUserId !== aktor.id && !aktor.admin) {
    return { galat: "Hanya penerima disposisi (atau admin) yang dapat menutupnya." };
  }
  if (disposisi.status === "selesai") {
    return { galat: "Disposisi ini sudah ditandai selesai." };
  }

  await db
    .update(schema.disposisi)
    .set({ status: "selesai", selesaiPada: new Date(), catatan })
    .where(eq(schema.disposisi.id, disposisiId));

  // Surat ditutup "selesai" bila tidak ada disposisi lain yang masih berjalan.
  const masihBerjalan = await db
    .select({ id: schema.disposisi.id })
    .from(schema.disposisi)
    .where(
      and(
        eq(schema.disposisi.suratMasukId, disposisi.suratMasukId),
        eq(schema.disposisi.status, "menunggu"),
      ),
    )
    .limit(1);

  if (masihBerjalan.length === 0) {
    await db
      .update(schema.suratMasuk)
      .set({ status: "selesai", updatedAt: new Date() })
      .where(eq(schema.suratMasuk.id, disposisi.suratMasukId));
  }

  await beriNotifikasi({
    userId: disposisi.dariUserId,
    judul: "Tindak lanjut disposisi",
    pesan: `${aktor.nama} menandai disposisi "${disposisi.instruksi}" sebagai selesai.`,
    tipe: "disposisi",
    link: `/dashboard/surat-masuk/${disposisi.suratMasukId}`,
  });

  await catatAksi({
    userId: aktor.id,
    aksi: "update",
    entitas: "disposisi",
    entitasId: disposisiId,
    perubahan: `status -> selesai. Catatan: ${catatan.slice(0, 120)}`,
  });

  return { sukses: "Disposisi ditandai selesai. Terima kasih." };
}

/** Menandai disposisi sudah dibaca oleh penerima. */
export async function tandaiDibaca(pegawaiId: string, disposisiId: string): Promise<void> {
  await db
    .update(schema.disposisi)
    .set({ dibacaPada: new Date(), status: "diproses" })
    .where(
      and(
        eq(schema.disposisi.id, disposisiId),
        eq(schema.disposisi.keUserId, pegawaiId),
      ),
    );
}


