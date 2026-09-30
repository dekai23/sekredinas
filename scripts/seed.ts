/**
 * Mengisi basis data dengan data master hasil ekstraksi berkas asli instansi:
 *   seed/struktur-organisasi.json  -> tabel unit_kerja
 *   seed/pegawai.json             -> tabel pegawai (sekaligus akun login)
 *   seed/instansi.json            -> tabel pengaturan
 *   lib/data/benih.ts             -> kategori surat & pengumuman
 *   lib/data/layanan.ts           -> informasi layanan portal publik
 *
 * Semua operasi memakai upsert sehingga skrip aman dijalankan berulang.
 *
 * Perintah:
 *   npm run db:seed
 *   npm run db:seed -- --hapus-pegawai   (mengosongkan tabel pegawai lebih dulu)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { agendaBenih, beritaBenih, kategoriSuratBenih, pengumumanBenih } from "../lib/data/benih";
import { layananBenih } from "../lib/data/layanan";
import { db, schema } from "../lib/db";

type JsonUnit = {
  nama: string;
  jenis: string;
  induk: string | null;
  kode: string;
  jumlahPegawai: number;
  pejabat: string[];
  namaPadaStrukturDocx: string | null;
  selisihNama: boolean;
};

type JsonPegawai = {
  no: number;
  nip: string;
  nama: string;
  pangkatGolongan: string;
  pangkat: string;
  golongan: string;
  jenisJabatan: string;
  jabatan: string;
  eselon: string;
  eselonTingkat: string;
  statusPegawai: string;
  peran: string;
  unitKerja: string;
  jenisUnit: string;
  indukUnit: string;
  usulanRole: string;
  email: string | null;
  usulanEmail: string;
  aktif: boolean;
};

const SANDI_AWAL = process.env.SEED_DEFAULT_PASSWORD || "Bkpsdm-Yahukimo2026";

function bacaJson<T>(namaBerkas: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), "seed", namaBerkas), "utf8")) as T;
}

/** Menyamakan nilai dari berkas Excel/Word ke enum database. */
const PETA_JENIS_UNIT: Record<string, (typeof schema.jenisUnitEnum.enumValues)[number]> = {
  badan: "badan",
  sekretariat: "sekretariat",
  sub_bagian: "sub_bagian",
  bidang: "bidang",
  sub_bidang: "sub_bidang",
  kelompok_jabatan_fungsional: "kelompok_jabatan_fungsional",
};

const PETA_PERAN: Record<string, (typeof schema.peranEnum.enumValues)[number]> = {
  kepala_badan: "kepala_badan",
  sekretaris: "sekretaris",
  kepala_bidang: "kepala_bidang",
  kepala_sub_bagian: "kepala_sub_bagian",
  kepala_sub_bidang: "kepala_sub_bidang",
  plt_kepala_sub_bidang: "plt_kepala_sub_bidang",
  plt_kepala_sub_bagian: "plt_kepala_sub_bagian",
  fungsional: "fungsional",
  pelaksana: "pelaksana",
};

const PETA_ROLE: Record<string, (typeof schema.roleEnum.enumValues)[number]> = {
  admin: "admin",
  pimpinan: "pimpinan",
  pegawai: "pegawai",
};

/** Eselon jabatan pimpinan unit, dipakai untuk mengurutkan hierarki. */
function eselonDariUnit(jenis: string): string | null {
  if (jenis === "badan") return "II.b";
  if (jenis === "sekretariat" || jenis === "bidang") return "III.b";
  if (jenis === "sub_bagian" || jenis === "sub_bidang") return "IV.a";
  return null;
}

/* ------------------------------------------------------------------ */
/* 1. Unit kerja (berjenjang:badan > sekretariat/bidang > sub unit)   */
/* ------------------------------------------------------------------ */

async function seedUnitKerja() {
  const unit = bacaJson<{ unit: JsonUnit[] }>("struktur-organisasi.json").unit;
  const idPerKode = new Map<string, string>();

  // Jalur 1: simpan semua unit lebih dulu tanpa induk...
  for (const [urutan, u] of unit.entries()) {
    const baris = await db
      .insert(schema.unitKerja)
      .values({
        nama: u.nama,
        kode: u.kode,
        jenis: PETA_JENIS_UNIT[u.jenis] ?? "sub_bidang",
        urutan: urutan + 1,
        pejabatEselon: eselonDariUnit(u.jenis),
      })
      .onConflictDoUpdate({
        target: schema.unitKerja.kode,
        set: {
          nama: u.nama,
          jenis: PETA_JENIS_UNIT[u.jenis] ?? "sub_bidang",
          urutan: urutan + 1,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.unitKerja.id, kode: schema.unitKerja.kode });
    idPerKode.set(baris[0].kode, baris[0].id);
  }

  // Jalur 2: pasang relasi induk.
  for (const u of unit) {
    if (!u.induk) continue;
    const idAnak = idPerKode.get(u.kode);
    const idInduk = unit.find((x) => x.nama === u.induk);
    if (!idAnak || !idInduk) continue;
    const idIndukValue = idPerKode.get(idInduk.kode);
    if (!idIndukValue) continue;
    await db
      .update(schema.unitKerja)
      .set({ indukId: idIndukValue, updatedAt: new Date() })
      .where(eqKode(u.kode));
  }

  console.log(`[seed] unit kerja: ${unit.length} unit (${idPerKode.size} terpetakan).`);
  return idPerKode;
}

function eqKode(kode: string) {
  return eq(schema.unitKerja.kode, kode);
}

/**
 * "Pemerintah Kabupaten Yahukimo" BUKAN unit kerja, melainkan induk tertinggi.
 * Fungsi ini memastikan baris unit bernama PEMKAB (bila pernah ada) dihapus,
 * lalu menandai unit Badan (BKD) berada langsung di bawah Pemkab - hanya bila
 * admin belum mengubahnya sendiri.
 */
async function seedPemerintahDaerah() {
  const dihapus = await db
    .delete(schema.unitKerja)
    .where(eq(schema.unitKerja.kode, "PEMKAB"))
    .returning({ id: schema.unitKerja.id });
  if (dihapus.length > 0) {
    console.log("[seed] unit PEMKAB (bukan unit kerja) dibersihkan.");
  }

  const bkd = await db
    .select({
      id: schema.unitKerja.id,
      indukId: schema.unitKerja.indukId,
      indukPemkab: schema.unitKerja.indukPemkab,
    })
    .from(schema.unitKerja)
    .where(eq(schema.unitKerja.kode, "BKD"))
    .limit(1);
  if (bkd[0] && !bkd[0].indukPemkab && bkd[0].indukId === null) {
    await db
      .update(schema.unitKerja)
      .set({ indukPemkab: true, updatedAt: new Date() })
      .where(eq(schema.unitKerja.id, bkd[0].id));
  }
  console.log("[seed] induk tertinggi: Pemerintah Kabupaten Yahukimo (bukan unit kerja).");
}

/* ------------------------------------------------------------------ */
/* 2. Pegawai + akun login                                            */
/* ------------------------------------------------------------------ */

async function seedPegawai(idPerKode: Map<string, string>) {
  const daftar = bacaJson<{ pegawai: JsonPegawai[] }>("pegawai.json").pegawai;
  const sandiHash = await hash(SANDI_AWAL, 10);
  const emailTerpakai = new Set<string>();
  let ditambah = 0;
  let diperbarui = 0;

  // Peta nama unit kerja -> kode unit, dari berkas struktur.
  const struktur = bacaJson<{ unit: JsonUnit[] }>("struktur-organisasi.json").unit;
  const kodePerNama = new Map(struktur.map((u) => [u.nama, u.kode]));

  for (const p of daftar) {
    const kodeUnit = kodePerNama.get(p.unitKerja) ?? null;
    const idUnit = kodeUnit ? (idPerKode.get(kodeUnit) ?? null) : null;

    // Email unik: pakai usulan email, bila bentrok tambahkan nomor urut.
    let email = (p.email || p.usulanEmail || `pegawai.${p.nip}`).trim().toLowerCase();
    if (emailTerpakai.has(email)) {
      email = `${email.split("@")[0]}.${p.nip.slice(-4)}@yahukimokab.go.id`;
    }
    emailTerpakai.add(email);

    const nilai = {
      nip: p.nip,
      namaLengkap: p.nama,
      pangkat: p.pangkat,
      golongan: p.golongan,
      pangkatGolongan: p.pangkatGolongan,
      jenisJabatan: p.jenisJabatan,
      jabatan: p.jabatan,
      eselon: p.eselon,
      statusPegawai: p.statusPegawai,
      peran: PETA_PERAN[p.peran] ?? "pelaksana",
      unitId: idUnit,
      email,
      role: PETA_ROLE[p.usulanRole] ?? "pegawai",
      aktif: p.aktif,
      sisaCuti: 12,
      tahunCuti: new Date().getFullYear(),
      updatedAt: new Date(),
    };

    const lama = await db
      .select({ id: schema.pegawai.id })
      .from(schema.pegawai)
      .where(eq(schema.pegawai.nip, p.nip))
      .limit(1);

    if (lama.length > 0) {
      await db.update(schema.pegawai).set(nilai).where(eq(schema.pegawai.id, lama[0].id));
      diperbarui += 1;
    } else {
      await db.insert(schema.pegawai).values({ ...nilai, passwordHash: sandiHash });
      ditambah += 1;
    }
  }

  const admin = daftar.filter((p) => p.usulanRole === "admin");
  console.log(
    `[seed] pegawai: ${ditambah} ditambah, ${diperbarui} diperbarui ` +
      `(${daftar.length} total; admin: ${admin.map((a) => a.nama).join(", ") || "-"}).`,
  );
}

/* ------------------------------------------------------------------ */
/* 3. Pengaturan instansi, kategori surat, layanan, pengumuman        */
/* ------------------------------------------------------------------ */

async function seedPengaturan() {
  const instansi = bacaJson<Record<string, string>>("instansi.json");
  const isi: Record<string, string> = {
    namaBadan: instansi.namaBadan ?? "",
    namaSingkat: instansi.namaSingkat ?? "",
    pemerintah: instansi.pemerintah ?? "",
    alamat: instansi.alamat ?? "",
    emailKantor: instansi.emailKantor ?? "",
    telepon: process.env.NEXT_PUBLIC_TELEPON_KANTOR ?? "",
    ukuranKertas: instansi.ukuranKertas ?? "F4 (21,6 x 33 cm)",
    zonaWaktu: instansi.zonaWaktu ?? "Asia/Jayapura",
    namaAplikasi: "BKPSDM Yahukimo",
    sosmedWhatsapp: process.env.NEXT_PUBLIC_SOSMED_WHATSAPP ?? "https://wa.me/6281234567890",
    sosmedFacebook: process.env.NEXT_PUBLIC_SOSMED_FACEBOOK ?? "https://www.facebook.com/pemkabyahukimo",
    sosmedInstagram: process.env.NEXT_PUBLIC_SOSMED_INSTAGRAM ?? "https://www.instagram.com/pemkabyahukimo",
    sosmedX: process.env.NEXT_PUBLIC_SOSMED_X ?? "https://x.com/pemkabyahukimo",
    sosmedYoutube: process.env.NEXT_PUBLIC_SOSMED_YOUTUBE ?? "https://www.youtube.com/@pemkabyahukimo",
    berandaJudul: "Satu pintu informasi Kepegawaian Kabupaten Yahukimo.",
    berandaSubjudul:
      "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo hadir dengan layanan informasi, berita kegiatan, dan agenda kepegawaian yang cepat, transparan, dan mudah diakses.",
    berandaSambutanJudul: "Melayani ASN, membangun SDM Yahukimo yang unggul",
    berandaSambutanIsi:
      "Selamat datang di portal resmi Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kabupaten Yahukimo. Portal ini kami hadirkan sebagai wujud komitmen terhadap keterbukaan informasi dan peningkatan kualitas pelayanan kepegawaian.\n\nKami mengajak seluruh ASN di lingkungan Pemerintah Kabupaten Yahukimo untuk terus meningkatkan kompetensi, integritas, dan semangat pelayanan demi kesejahteraan masyarakat.",
    berandaSambutanNama: "",
    berandaSambutanJabatan: "",
    berandaSambutanFoto: "",
    sandiAwalSeed: SANDI_AWAL,
  };

  for (const [kunci, nilai] of Object.entries(isi)) {
    await db
      .insert(schema.pengaturan)
      .values({ kunci, nilai })
      .onConflictDoUpdate({
        target: schema.pengaturan.kunci,
        set: { nilai, updatedAt: new Date() },
      });
  }
  console.log(`[seed] pengaturan instansi: ${Object.keys(isi).length} kunci.`);
}

async function seedKategoriSurat() {
  for (const k of kategoriSuratBenih) {
    await db
      .insert(schema.kategoriSurat)
      .values({ kode: k.kode, nama: k.nama, uraian: k.uraian })
      .onConflictDoUpdate({
        target: schema.kategoriSurat.kode,
        set: { nama: k.nama, uraian: k.uraian },
      });
  }
  console.log(`[seed] kategori surat: ${kategoriSuratBenih.length} kategori.`);
}

async function seedLayanan(idPerKode: Map<string, string>) {
  for (const [urutan, l] of layananBenih.entries()) {
    const idUnit = l.kodeUnit ? (idPerKode.get(l.kodeUnit) ?? null) : null;
    await db
      .insert(schema.layanan)
      .values({
        judul: l.judul,
        slug: l.slug,
        ringkasan: l.ringkasan,
        deskripsi: l.deskripsi,
        syarat: JSON.stringify(l.syarat),
        alur: JSON.stringify(l.alur),
        waktuPenyelesaian: l.waktuPenyelesaian,
        dasarHukum: l.dasarHukum,
        unitId: idUnit,
        urutan: urutan + 1,
        publik: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.layanan.slug,
        set: { judul: l.judul, ringkasan: l.ringkasan, updatedAt: new Date() },
      });
  }
  console.log(`[seed] layanan publik: ${layananBenih.length} layanan.`);
}

async function seedPengumuman() {
  const admin = await db
    .select({ id: schema.pegawai.id })
    .from(schema.pegawai)
    .where(eq(schema.pegawai.role, "admin"))
    .limit(1);
  const dibuatOleh = admin[0]?.id ?? null;
  if (!dibuatOleh) {
    console.log("[seed] pengumuman dilewati: belum ada akun admin.");
    return;
  }

  for (const p of pengumumanBenih) {
    const ada = await db
      .select({ id: schema.pengumuman.id })
      .from(schema.pengumuman)
      .where(eq(schema.pengumuman.judul, p.judul))
      .limit(1);
    if (ada.length > 0) continue;
    await db.insert(schema.pengumuman).values({
      judul: p.judul,
      ringkasan: p.ringkasan,
      isi: p.isi,
      kategori: p.kategori,
      internal: p.internal,
      publik: p.publik,
      createdBy: dibuatOleh,
    });
  }
  console.log(`[seed] pengumuman awal: ${pengumumanBenih.length} judul.`);
}

/* ------------------------------------------------------------------ */

/** Waktu WIT (UTC+9) dari offset hari + jam, dipakai untuk benih agenda. */
function waktuWitSeed(offsetHari: number, jam: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offsetHari);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return new Date(`${y}-${m}-${day}T${String(jam).padStart(2, "0")}:00:00+09:00`);
}

async function idAdmin(): Promise<string | null> {
  const admin = await db
    .select({ id: schema.pegawai.id })
    .from(schema.pegawai)
    .where(eq(schema.pegawai.role, "admin"))
    .limit(1);
  return admin[0]?.id ?? null;
}

async function seedBerita() {
  const dibuatOleh = await idAdmin();
  if (!dibuatOleh) {
    console.log("[seed] berita dilewati: belum ada akun admin.");
    return;
  }
  let ditambah = 0;
  for (const b of beritaBenih) {
    const ada = await db
      .select({ id: schema.berita.id })
      .from(schema.berita)
      .where(eq(schema.berita.slug, b.slug))
      .limit(1);
    if (ada.length > 0) continue;
    const terbit = new Date();
    terbit.setDate(terbit.getDate() - b.hariLalu);
    await db.insert(schema.berita).values({
      judul: b.judul,
      slug: b.slug,
      ringkasan: b.ringkasan,
      isi: b.isi,
      kategori: b.kategori,
      publik: true,
      tanggalTerbit: terbit,
      createdBy: dibuatOleh,
    });
    ditambah += 1;
  }
  console.log(`[seed] berita: ${ditambah} ditambahkan (${beritaBenih.length} benih).`);
}

async function seedAgenda() {
  const dibuatOleh = await idAdmin();
  if (!dibuatOleh) {
    console.log("[seed] agenda dilewati: belum ada akun admin.");
    return;
  }
  let ditambah = 0;
  for (const a of agendaBenih) {
    const ada = await db
      .select({ id: schema.agenda.id })
      .from(schema.agenda)
      .where(eq(schema.agenda.judul, a.judul))
      .limit(1);
    if (ada.length > 0) continue;
    await db.insert(schema.agenda).values({
      judul: a.judul,
      deskripsi: a.deskripsi,
      lokasi: a.lokasi,
      jenis: a.jenis,
      mulai: waktuWitSeed(a.hari, a.jamMulai),
      selesai: waktuWitSeed(a.hari, a.jamSelesai),
      publik: a.publik,
      createdBy: dibuatOleh,
    });
    ditambah += 1;
  }
  console.log(`[seed] agenda: ${ditambah} ditambahkan (${agendaBenih.length} benih).`);
}

export interface OpsiSeed {
  hapusPegawai?: boolean;
  paksa?: boolean;
}

/**
 * Mengisi data. TIDAK memanggil process.exit, sehingga aman dipanggil dari
 * server (mis. route /api/setup) maupun sebagai skrip CLI.
 * Bila database sudah berisi data, seeding dilewati (kecuali `paksa`).
 */
export async function jalankanSeed(opsi: OpsiSeed = {}): Promise<void> {
  if (opsi.hapusPegawai) {
    await db.delete(schema.pegawai);
    console.log("[seed] tabel pegawai dikosongkan.");
  }

  if (!opsi.paksa && !opsi.hapusPegawai) {
    try {
      const ada = await db.select({ id: schema.pegawai.id }).from(schema.pegawai).limit(1);
      if (ada.length > 0) {
        console.log("[seed] database sudah berisi data - seeding dilewati.");
        return;
      }
    } catch {
      // Tabel belum ada (database baru) -> lanjutkan seeding.
    }
  }

  const idPerKode = await seedUnitKerja();
  await seedPemerintahDaerah();
  await seedPegawai(idPerKode);
  await seedPengaturan();
  await seedKategoriSurat();
  await seedLayanan(idPerKode);
  await seedPengumuman();
  await seedBerita();
  await seedAgenda();

  console.log("[seed] selesai.");
}

async function utama() {
  await jalankanSeed({
    hapusPegawai: process.argv.includes("--hapus-pegawai"),
    paksa: process.argv.includes("--paksa"),
  });
  process.exit(0);
}

// Hanya dijalankan otomatis bila dipanggil langsung sebagai skrip CLI
// (mis. `npm run db:seed`), bukan saat diimpor oleh route server.
if (/seed\.(ts|js)$/.test(process.argv[1] ?? "")) {
  utama().catch((galat: unknown) => {
    const e = galat as { message?: string; cause?: unknown; stack?: string };
    console.error("[seed] GAGAL:", e.message ?? galat);
    if (e.cause) console.error("[seed] penyebab:", e.cause);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  });
}
