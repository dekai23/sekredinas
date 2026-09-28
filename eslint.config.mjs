import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Skrip build/migrate/seed berjalan di luar Next.js, tapi tetap di-lint.
    "drizzle/**",
  ]),
  {
    rules: {
      // Logo instansi & kop surat sengaja memakai <img> biasa: ukurannya
      // diturunkan dari satuan cm (2,56 x 2,43 cm) agar identik dengan
      // berkas kop bkd.docx, dan tidak perlu melalui optimizer next/image.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
