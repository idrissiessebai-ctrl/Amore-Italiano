"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { SafiContent } from "@/lib/safi";

export default function SafiGallery({ content }: { content: SafiContent["gallery"] }) {
  const photos = content.images;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowRight") {
        setSelectedIndex((current) => (current === null ? 0 : (current + 1) % photos.length));
      }
      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) => (current === null ? 0 : (current - 1 + photos.length) % photos.length));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, photos.length]);

  return (
    <section className="bg-[#f7f2e8] py-24">
      <div className="mx-auto w-[92%] max-w-[1180px]">
        <div className="mb-14 max-w-[780px]">
          <div className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#a92e27]">
            {content.eyebrow}
          </div>
          <h2 className="serif text-[clamp(42px,6vw,72px)] leading-[.98]">{content.title}</h2>
          <p className="mt-5 max-w-[650px] leading-7 text-[#6e6a61]">
            {content.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.25fr_.75fr_.75fr] lg:grid-rows-[260px_260px]">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`group relative min-h-[260px] overflow-hidden rounded-sm bg-[#e8e1d4] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a92e27] focus-visible:ring-offset-4 ${index === 0 ? "lg:row-span-2" : ""}`}
              aria-label={`Agrandir : ${photo.alt}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 40vw"
                className="object-cover transition duration-500 group-hover:scale-105"
                priority={index === 0}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pb-4 pt-12 text-sm font-semibold text-white">
                {photo.caption}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-7 text-[11px] leading-5 text-[#6e6a61]">Les images de cette galerie sont gérées depuis le tableau de bord administrateur.</p>
      </div>

      <AnimatePresence>
        {selectedPhoto && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedIndex(null);
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute right-6 top-6 z-[110] cursor-pointer rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 backdrop-blur-sm"
              aria-label="Fermer la galerie"
            >
              <span className="flex h-6 w-6 items-center justify-center text-2xl leading-none">×</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
              }}
              className="absolute left-4 top-1/2 z-[110] -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 backdrop-blur-sm"
              aria-label="Image précédente"
            >
              <span className="flex h-6 w-6 items-center justify-center text-3xl leading-none">‹</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedIndex((selectedIndex + 1) % photos.length);
              }}
              className="absolute right-4 top-1/2 z-[110] -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 backdrop-blur-sm"
              aria-label="Image suivante"
            >
              <span className="flex h-6 w-6 items-center justify-center text-3xl leading-none">›</span>
            </button>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedPhoto.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhoto.alt}
                className="relative flex h-[85vh] w-[90vw] max-h-[85vh] max-w-[90vw] items-center justify-center"
              >
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.alt}
              fill
              sizes="100vw"
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            <p className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 text-center text-sm text-white">
              {selectedPhoto.caption}
            </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
