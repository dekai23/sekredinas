import type { MetadataRoute } from "next";

const BERANDA = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Peta situs portal publik (PRD 8.1). Halaman internal tidak diindeks. */
export default function sitemap(): MetadataRoute.Sitemap {
  const rute = ["", "/profil", "/layanan", "/berita", "/galeri", "/pengumuman", "/agenda", "/kontak"];
  const sekarang = new Date();
  return rute.map((r) => ({
    url: `${BERANDA}${r}`,
    lastModified: sekarang,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
