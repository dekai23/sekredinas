/**
 * Logika bisnis pengajuan & persetujuan cuti (PRD 6.G).
 *
 * Aturan:
 *  - jumlah hari dihitung server-side sebagai hari kerja (Senin-Jumat),
 *  - tidak boleh bentrok dengan cuti lain yang sudah disetujui/menunggu,
 *  - kuota cuti tahunan dikurangi saat pengajuan cuti tahunan disetujui.
 */
import { and, eq, gte, lte, ne, or } from "drizzle-orm";

import { beriNotifikasi, catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { hitungHariKerja } from "@/lib/utils";
import { galatZod, skemaCuti, type HasilForm } from "@/lib/validasi/konten";

export interface HasilCuti extends HasilForm {
  id?: string;
  totalHari?: number;
}

export async function ajukanCuti(
  pegawaiId: string,
  form: FormData,
): Promise<HasilCuti> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaCuti.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian cuti.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const totalHari = hitungHariKerja(
    new Date(data.tanggalMulai),
    new Date(data.tanggalSelesai),
  );
  if (totalHari <= 0) {
    return { field: { tanggalSelesai: "Rentang cuti tidak memuat hari kerja." } };
  }

  // Bentrok dengan cuti lain yang belum ditolak.
  const bentrok = await db
    .select({ id: schema.cuti.id })
    .from(schema.cuti)
    .where(
      and(
        eq(schema.cuti.pegawaiId, pegawaiId),
        ne(schema.cuti.status, "ditolak"),
        lte(schema.cuti.tanggalMulai, data.tanggalSelesai),
        gte(schema.cuti.tanggalSelesai, data.tanggalMulai),
      ),
    )
    .limit(1);
  if (bentrok.length > 0) {
    return { galat: "Anda sudah memiliki pengajuan cuti pada rentang tanggal tersebut." };
  }

  if (data.jenisCuti === "cuti_annual") {
    const pegawai = await db
      .select({ sisaCuti: schema.pegawai.sisaCuti })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.id, pegawaiId))
      .limit(1);
    const sisa = pegawai[0]?.sisaCuti ?? 0;
    if (totalHari > sisa) {
      return { galat: `Sisa cuti tahunan Anda ${sisa} hari, tidak cukup untuk ${totalHari} hari.` };
    }
  }

  const [tersimpan] = await db
    .insert(schema.cuti)
    .values({
      pegawaiId,
      jenisCuti: data.jenisCuti,
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: data.tanggalSelesai,
      totalHari,
      alasan: data.alasan,
      alamatTujuan: data.alamatTujuan || null,
      kontak: data.kontak || null,
      status: "menunggu",
    })
    .returning({ id: schema.cuti.id });

  // Beri tahu seluruh pimpinan aktif.
  const pimpinan = await db
    .select({ id: schema.pegawai.id })
    .from(schema.pegawai)
    .where(
      or(
        eq(schema.pegawai.role, "pimpinan"),
        eq(schema.pegawai.role, "admin"),
      ),
    );
  const [pemohon] = await db
    .select({ nama: schema.pegawai.namaLengkap })
    .from(schema.pegawai)
    .where(eq(schema.pegawai.id, pegawaiId))
    .limit(1);
  for (const p of pimpinan) {
    await beriNotifikasi({
      userId: p.id,
      judul: "Pengajuan cuti baru",
      pesan: `${pemohon?.nama ?? "Pegawai"} mengajukan cuti ${totalHari} hari.`,
      tipe: "persetujuan_cuti",
      link: "/dashboard/persetujuan/cuti",
    });
  }

  await catatAksi({
    userId: pegawaiId,
    aksi: "create",
    entitas: "cuti",
    entitasId: tersimpan.id,
    perubahan: `Pengajuan ${data.jenisCuti} ${data.tanggalMulai}..${data.tanggalSelesai} (${totalHari} hari)`,
  });

  return { sukses: `Pengajuan cuti ${totalHari} hari terkirim.`, id: tersimpan.id, totalHari };
}

export async function setujuiCuti(
  penyetujuId: string,
  id: string,
  catatan: string,
): Promise<HasilForm> {
  const baris = await db
    .select({
      pegawaiId: schema.cuti.pegawaiId,
      jenisCuti: schema.cuti.jenisCuti,
      totalHari: schema.cuti.totalHari,
      status: schema.cuti.status,
    })
    .from(schema.cuti)
    .where(eq(schema.cuti.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Pengajuan cuti tidak ditemukan." };
  const cuti = baris[0];
  if (cuti.status !== "menunggu") return { galat: "Pengajuan ini sudah diproses." };

  const pegawai = await db
    .select({ sisaCuti: schema.pegawai.sisaCuti })
    .from(schema.pegawai)
    .where(eq(schema.pegawai.id, cuti.pegawaiId))
    .limit(1);
  const sisaLama = pegawai[0]?.sisaCuti ?? 0;
  const sisaBaru =
    cuti.jenisCuti === "cuti_annual" ? Math.max(0, sisaLama - cuti.totalHari) : sisaLama;

  await db
    .update(schema.cuti)
    .set({
      status: "disetujui",
      disetujuiOlehId: penyetujuId,
      disetujuiPada: new Date(),
      catatanPersetujuan: catatan || null,
      sisaCutiSetelah: sisaBaru,
      updatedAt: new Date(),
    })
    .where(eq(schema.cuti.id, id));

  if (cuti.jenisCuti === "cuti_annual") {
    await db
      .update(schema.pegawai)
      .set({ sisaCuti: sisaBaru, updatedAt: new Date() })
      .where(eq(schema.pegawai.id, cuti.pegawaiId));
  }

  await beriNotifikasi({
    userId: cuti.pegawaiId,
    judul: "Cuti disetujui",
    pesan: `Pengajuan cuti Anda disetujui. Catatan: ${catatan || "-"}`,
    tipe: "persetujuan_cuti",
    link: "/dashboard/cuti",
  });

  await catatAksi({
    userId: penyetujuId,
    aksi: "setujui",
    entitas: "cuti",
    entitasId: id,
    perubahan: `Cuti ${cuti.totalHari} hari disetujui`,
  });

  return { sukses: "Pengajuan cuti disetujui." };
}

export async function tolakCuti(
  penyetujuId: string,
  id: string,
  catatan: string,
): Promise<HasilForm> {
  if (!catatan.trim()) return { field: { catatan: "Alasan penolakan wajib diisi." } };

  const baris = await db
    .select({ pegawaiId: schema.cuti.pegawaiId, status: schema.cuti.status })
    .from(schema.cuti)
    .where(eq(schema.cuti.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Pengajuan cuti tidak ditemukan." };
  if (baris[0].status !== "menunggu") return { galat: "Pengajuan ini sudah diproses." };

  await db
    .update(schema.cuti)
    .set({
      status: "ditolak",
      disetujuiOlehId: penyetujuId,
      disetujuiPada: new Date(),
      catatanPersetujuan: catatan,
      updatedAt: new Date(),
    })
    .where(eq(schema.cuti.id, id));

  await beriNotifikasi({
    userId: baris[0].pegawaiId,
    judul: "Cuti ditolak",
    pesan: `Pengajuan cuti Anda ditolak. Catatan: ${catatan}`,
    tipe: "persetujuan_cuti",
    link: "/dashboard/cuti",
  });

  await catatAksi({
    userId: penyetujuId,
    aksi: "tolak",
    entitas: "cuti",
    entitasId: id,
    perubahan: `Cuti ditolak: ${catatan.slice(0, 120)}`,
  });

  return { sukses: "Pengajuan cuti ditolak." };
}
