import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Building2, Mail, MapPin, Phone } from "lucide-react";

import { KopSurat } from "@/components/kop/kop-surat";
import { Kartu, KartuIsi, KartuKepala, Lencana } from "@/components/ui/dasar";
import { db, schema } from "@/lib/db";
import { identitasInstansi } from "@/lib/data/instansi";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Profil Instansi",
  description:
    "Profil, tugas dan fungsi, serta struktur organisasi Badan Kepegawaian dan " +
    "Pengembangan Sumber Daya Manusia Kabupaten Yahukimo.",
};

const TUGAS_FUNGSI = [
  "Menyusun kebijakan di bidang kepegawaian dan pengembangan sumber daya manusia",
  "Melaksanakan administrasi kepegawaian, penggajian, dan tunjangan",
  "Menyelenggarakan seleksi, pengangkatan, promosi, dan mutasi ASN",
  "Menyelenggarakan kenaikan pangkat dan pengangkatan",
  "Menyelenggarakan administrasi pensiun dan hak-hak pegawai",
  "Melaksanakan pembinaan dan pengembangan kompetensi ASN",
  "Menyelenggarakan informasi kepegawaian serta pelayanan publik",
  "Melaksanakan tugas lain yang diperintahkan Bupati",
];

/** Halaman profil instansi: identitas, tugas fungsi, dan struktur organisasi. */
export default async function HalamanProfil() {
  const instansi = await identitasInstansi();
  const unit = await db
    .select({
      id: schema.unitKerja.id,
      nama: schema.unitKerja.nama,
      kode: schema.unitKerja.kode,
      jenis: schema.unitKerja.jenis,
      indukId: schema.unitKerja.indukId,
      urutan: schema.unitKerja.urutan,
      pejabatEselon: schema.unitKerja.pejabatEselon,
    })
    .from(schema.unitKerja)
    .orderBy(asc(schema.unitKerja.urutan));

  const pejabatUnit = await db
    .select({
      unitId: schema.pegawai.unitId,
      nama: schema.pegawai.namaLengkap,
      jabatan: schema.pegawai.jabatan,
      peran: schema.pegawai.peran,
    })
    .from(schema.pegawai);

  const namaPejabat = (unitId: string | null) => {
    if (!unitId) return null;
    return (
      pejabatUnit.find((p) => p.unitId === unitId && p.peran !== "pelaksana")?.nama ?? null
    );
  };

  // Unit teratas (tanpa induk) beserta seluruh data unit untuk pohon.
  const semuaUnit = unit;
  const atas = bangunPohonUnit(semuaUnit);

  const LEBAR_JENIS: Record<string, string> = {
    badan: "Badan",
    sekretariat: "Sekretariat",
    bidang: "Bidang",
    sub_bidang: "Sub Bidang",
    sub_bagian: "Sub Bagian",
    kelompok_jabatan_fungsional: "Kelompok Jabatan Fungsional",
  };

  return (
    <div>
      <section className="border-b border-navy-100 bg-navy-50/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <KopSurat />
          <div className="mt-8">
            <Lencana nada="emas">Profil Instansi</Lencana>
            <h1 className="mt-3 text-3xl font-bold text-navy-800">{instansi.namaBadan}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-600">
              Instansi pemerintah daerah di Kabupaten Yahukimo yang melaksanakan urusan
              pemerintahan di bidang kepegawaian dan pengembangan sumber daya manusia.
            </p>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-navy-100 bg-white px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-navy-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> Alamat
              </dt>
              <dd className="mt-1 text-sm text-navy-800">{instansi.alamat}</dd>
            </div>
            <div className="rounded-lg border border-navy-100 bg-white px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-navy-500">
                <Mail className="h-3.5 w-3.5" aria-hidden /> Email
              </dt>
              <dd className="mt-1 text-sm text-navy-800">{instansi.emailKantor}</dd>
            </div>
            <div className="rounded-lg border border-navy-100 bg-white px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-navy-500">
                <Phone className="h-3.5 w-3.5" aria-hidden /> Telepon
              </dt>
              <dd className="mt-1 text-sm text-navy-800">
                {instansi.telepon || "Belum diisi"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <Kartu>
          <KartuKepala
            judul="Tugas dan fungsi"
            deskripsi="Ringkasan kewenangan bidang kepegawaian dan pengembangan sumber daya manusia."
          />
          <KartuIsi>
            <ul className="grid gap-2 sm:grid-cols-2">
              {TUGAS_FUNGSI.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700"
                >
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </KartuIsi>
        </Kartu>

        <Kartu>
          <KartuKepala
            judul="Struktur organisasi"
            deskripsi={`${unit.length} unit kerja, sesuai STRUKTUR.docx. Nama unit dapat disesuaikan oleh admin.`}
          />
          <KartuIsi className="space-y-5">
            {atas.map((u) => (
              <UnitBaris
                key={u.id}
                unit={u}
                semuaUnit={semuaUnit}
                namaPejabat={namaPejabat}
                lebarJenis={LEBAR_JENIS}
                tingkat={0}
              />
            ))}
          </KartuIsi>
        </Kartu>
      </section>
    </div>
  );
}

interface BarisUnit {
  id: string;
  nama: string;
  kode: string;
  jenis: string;
  indukId: string | null;
  pejabatEselon: string | null;
}

/** Semua unit kerja, dikelompokkan induk -> anak untuk tampilan berjenjang. */
function bangunPohonUnit(unit: BarisUnit[]): BarisUnit[] {
  return unit
    .filter((u) => u.indukId === null)
    .map((u) => ({ ...u }));
}

/** Sub unit langsung dari sebuah unit. */
function subUnit(unit: BarisUnit[], indukId: string): BarisUnit[] {
  return unit.filter((u) => u.indukId === indukId);
}

/** Satu baris unit beserta sub unitnya, ditampilkan berjenjang. */
function UnitBaris({
  unit,
  semuaUnit,
  namaPejabat,
  lebarJenis,
  tingkat,
}: {
  unit: BarisUnit;
  semuaUnit: BarisUnit[];
  namaPejabat: (id: string | null) => string | null;
  lebarJenis: Record<string, string>;
  tingkat: number;
}) {
  const pejabat = namaPejabat(unit.id);
  const anak = subUnit(semuaUnit, unit.id);
  return (
    <div className={tingkat === 0 ? "" : "ml-4 border-l border-navy-100 pl-4"}>
      <div className="rounded-lg border border-navy-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Lencana nada={tingkat === 0 ? "emas" : "netral"}>{unit.kode}</Lencana>
          <p className="font-semibold text-navy-800">{unit.nama}</p>
          {unit.pejabatEselon ? (
            <span className="text-xs text-navy-400">{unit.pejabatEselon}</span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-navy-500">
          {lebarJenis[unit.jenis] ?? unit.jenis}
          {pejabat ? ` · Pejabat: ${pejabat}` : " · Belum ada pejabat definitif"}
        </p>
      </div>
      {anak.length > 0 ? (
        <div className="mt-2 space-y-2">
          {anak.map((a) => (
            <UnitBaris
              key={a.id}
              unit={a}
              semuaUnit={semuaUnit}
              namaPejabat={namaPejabat}
              lebarJenis={lebarJenis}
              tingkat={tingkat + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}