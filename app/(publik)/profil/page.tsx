import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Building2, Mail, MapPin, Phone } from "lucide-react";

import { GelombangNavy } from "@/components/publik/ilustrasi";
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
      indukPemkab: schema.unitKerja.indukPemkab,
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
  const atasPemkab = semuaUnit.filter((u) => u.indukPemkab);
  const atasLain = semuaUnit.filter((u) => u.indukId === null && !u.indukPemkab);

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
      <section className="relative overflow-hidden">
        <GelombangNavy className="absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Lencana nada="emas">Profil Instansi</Lencana>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold text-white">{instansi.namaBadan}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-100">
            Instansi pemerintah daerah di Kabupaten Yahukimo yang melaksanakan urusan
            pemerintahan di bidang kepegawaian dan pengembangan sumber daya manusia.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-emas-200">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> Alamat
              </dt>
              <dd className="mt-1 text-sm text-white">{instansi.alamat}</dd>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-emas-200">
                <Mail className="h-3.5 w-3.5" aria-hidden /> Email
              </dt>
              <dd className="mt-1 text-sm text-white">{instansi.emailKantor}</dd>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-emas-200">
                <Phone className="h-3.5 w-3.5" aria-hidden /> Telepon
              </dt>
              <dd className="mt-1 text-sm text-white">
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
            {atasPemkab.length > 0 ? (
              <div className="rounded-xl border-2 border-navy-200 bg-navy-50/50 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Lencana nada="gelap">Pemerintah Kabupaten Yahukimo</Lencana>
                </div>
                <div className="space-y-2">
                  {atasPemkab.map((u) => (
                    <UnitBaris
                      key={u.id}
                      unit={u}
                      semuaUnit={semuaUnit}
                      namaPejabat={namaPejabat}
                      lebarJenis={LEBAR_JENIS}
                      tingkat={1}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {atasLain.map((u) => (
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