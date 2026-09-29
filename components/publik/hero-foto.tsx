"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Latar hero berupa beberapa foto yang berganti-ganti (fade) tiap 6 detik.
 * Foto masih placeholder dari internet; nanti dapat diganti foto asli.
 */
const FOTO: string[] = [
  "https://picsum.photos/seed/bkpsdm-hero1/1920/1080",
  "https://picsum.photos/seed/bkpsdm-hero2/1920/1080",
  "https://picsum.photos/seed/bkpsdm-hero3/1920/1080",
  "https://picsum.photos/seed/bkpsdm-hero4/1920/1080",
];

export function HeroFoto() {
  const [aktif, setAktif] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAktif((n) => (n + 1) % FOTO.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {FOTO.map((f, i) => (
        <img
          key={f}
          src={f}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            i === aktif ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </>
  );
}
