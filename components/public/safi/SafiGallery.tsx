"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SafiContent } from "@/lib/safi";

export default function SafiGallery({ content }: { content: SafiContent["gallery"] }) {
  const photos = content.images;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];

  const openLightbox = (index: number) => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    setIsImageVisible(false);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setIsImageVisible(false);
    closeTimer.current = window.setTimeout(() => {
      setSelectedIndex(null);
      closeTimer.current = null;
    }, 220);
  };

  useEffect(() => {
    if (selectedIndex === null) return;

    const frame = window.requestAnimationFrame(() => setIsImageVisible(true));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
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
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, photos.length]);

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

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
              onClick={() => openLightbox(index)}
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

      {selectedPhoto && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-opacity duration-[220ms]"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhoto.alt}
            className={`relative flex h-[85vh] w-[90vw] max-h-[85vh] max-w-[90vw] items-center justify-center transition-[opacity,transform] duration-[220ms] ease-out ${isImageVisible ? "scale-100 opacity-100" : "scale-[.95] opacity-0"}`}
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
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-0 top-0 rounded-full bg-white/90 px-4 py-2 text-2xl leading-none text-[#171717] transition hover:bg-white"
              aria-label="Fermer la galerie"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => {
                setIsImageVisible(false);
                setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
              }}
              className="absolute left-2 top-1/2 rounded-full bg-white/90 px-4 py-2 text-2xl text-[#171717] transition hover:bg-white sm:-left-14"
              aria-label="Image précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                setIsImageVisible(false);
                setSelectedIndex((selectedIndex + 1) % photos.length);
              }}
              className="absolute right-2 top-1/2 rounded-full bg-white/90 px-4 py-2 text-2xl text-[#171717] transition hover:bg-white sm:-right-14"
              aria-label="Image suivante"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
