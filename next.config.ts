import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Logo instansi dipakai pada kop surat & halaman publik (PNG besar, 1813x1504).
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // PGlite hanya dipakai di sisi server; pastikan tidak ikut ter-bundle ke klien.
  // `postgres` juga dimasukkan karena paket itu memuat modul node (tls, net).
  serverExternalPackages: ["@electric-sql/pglite", "bcryptjs", "postgres"],
  async headers() {
    return [
      {
        // Halaman internal tidak boleh diindeks mesin pencari (PRD 8.1).
        source: "/:path(dashboard|admin|masuk)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

