"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getPublicImageUrl } from "@/lib/utils/image";

type SafiGallerySectionProps = {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  images: string[];
};

const fallbackImage = "/images/amore-32-jpg.webp";

export default function SafiGallerySection({ title, description, buttonText, buttonLink, images }: SafiGallerySectionProps) {
  const slides = (images.length ? images : [fallbackImage]).map(getPublicImageUrl);
  const [activeIndex, setActiveIndex] = useState(0);

  function move(direction: 1 | -1) {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <section id="safi" className="overflow-x-clip bg-[#f7f2e8] py-25">
      <div className="mx-auto grid min-w-0 w-[92%] max-w-[1180px] items-center gap-12 md:grid-cols-2">
        <div className="relative min-w-0 w-full max-w-full overflow-hidden rounded-xl bg-[#e8e1d4]">
          <div className="flex w-full min-w-0 max-w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
            {slides.map((image, index) => (
              <div key={`${image}-${index}`} className="relative w-full min-w-0 shrink-0 aspect-[4/3] md:aspect-[3/4]">
                <Image src={image} alt={`${title} — image ${index + 1}`} fill sizes="(max-width: 768px) 92vw, 50vw" className="object-cover" priority={index === 0} />
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <>
              <button type="button" aria-label="Image précédente" onClick={() => move(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-[#f7f2e8]/90 p-3 text-[#171717] shadow transition hover:bg-[#f7f2e8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a92e27]">
                <ChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Image suivante" onClick={() => move(1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#f7f2e8]/90 p-3 text-[#171717] shadow transition hover:bg-[#f7f2e8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a92e27]">
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1">
                {slides.map((image, index) => (
                  <button key={`${image}-dot-${index}`} type="button" aria-label={`Afficher l'image ${index + 1}`} onClick={() => setActiveIndex(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#a92e27]">Ciao, Safi.</div>
          <h2 className="serif break-words text-[clamp(42px,12vw,60px)] leading-none">{title}</h2>
          <p className="mt-6 max-w-[560px] text-[#4a4741]">{description}</p>
          <Link className="mt-6 inline-block rounded-full bg-[#a92e27] px-6 py-3 text-sm font-bold !text-white" href={buttonLink || "/safi"}>
            {buttonText || "DÉCOUVRIR SAFI"}
          </Link>
        </div>
      </div>
    </section>
  );
}
