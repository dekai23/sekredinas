import type { Metadata, Viewport } from "next";

import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

const BERANDA = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BERANDA),
  title: {
    default:
      "SekreDinas — Badan Kepegawaian dan Pengembangan SDM Kabupaten Yahukimo",
    template: "%s — SekreDinas BKPSDM Yahukimo",
  },
  description:
    "Portal informasi dan sistem manajemen persuratan, disposisi, arsip digital, " +
    "serta kepegawaian Badan Kepegawaian dan Pengembangan Sumber Daya Manusia " +
    "Kabupaten Yahukimo.",
  applicationName: "SekreDinas",
  authors: [{ name: "BKPSDM Kabupaten Yahukimo" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SekreDinas BKPSDM Yahukimo",
    images: ["/logo-yahukimo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#16305c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-navy-50 font-sans text-navy-900 antialiased">{children}</body>
    </html>
  );
}
