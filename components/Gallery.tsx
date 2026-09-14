"use client";
import Image from "next/image";
import { useState } from "react";
import { getPublicImageUrl } from "@/lib/utils/image";
const images = [
  ["amore-11-png.webp", 1086, 1448], ["amore-13-jpg.webp", 1367, 2048],
  ["amore-15-jpg.webp", 2048, 1367], ["amore-17-jpg.webp", 2048, 1367],
  ["amore-19-jpg.webp", 1367, 2048], ["amore-21-png.webp", 1248, 1872],
  ["amore-23-png.webp", 1638, 2048], ["amore-25-png.webp", 1638, 2048],
  ["amore-27-png.webp", 1366, 2048], ["amore-29-png.webp", 1638, 2048],
  ["amore-31-png.webp", 1638, 2048],
] as const;
export default function Gallery() {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_.75fr_.95fr] lg:grid-rows-[280px_280px]">
      {images.map(([image, width, height], i) => (
        <a
          key={image}
          href={getPublicImageUrl(`/images/${image}`)}
            target="_blank"
            rel="noreferrer"
            className={`${i > 5 && !expanded ? "hidden" : ""} group relative h-[300px] overflow-hidden rounded-[14px] bg-[#e8e1d5] lg:h-auto ${i === 0 ? "lg:row-span-2" : ""} ${i === 3 ? "lg:col-span-2" : ""}`}
          >
          <Image
            src={getPublicImageUrl(`/images/${image}`)}
            alt="Création Amore Italiano"
            width={width}
            height={height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <span className="absolute bottom-4 left-4 rounded-full bg-[#f7f2e8]/90 px-3 py-2 text-[11px] font-bold uppercase tracking-wider">
              {i === 0 ? "Nos créations" : "Amore Italiano"}
            </span>
          </a>
        ))}
      </div>
      <div className="mt-7 text-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-full border border-[#596246] px-6 py-3 text-xs font-bold text-[#596246] hover:bg-[#596246] hover:text-white"
        >
          {expanded ? "Afficher moins" : "Afficher plus"}
        </button>
      </div>
    </>
  );
}
