import Link from "next/link";

export const dynamic = "force-dynamic";

/** Halaman 404 untuk area publik. */
export default function TidakDitemukan() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <p className="font-mono text-6xl font-bold text-biru-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-navy-800">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-navy-600">
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan. Silakan kembali ke
        beranda.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-biru-600 px-5 text-sm font-semibold text-white hover:bg-biru-700"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}