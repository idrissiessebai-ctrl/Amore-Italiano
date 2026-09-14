"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicImageUrl } from "@/lib/utils/image";

const links = [
  ["Histoire", "#histoire"],
  ["Menu", "#menu"],
  ["Safi", "/safi"],
  ["Adresse", "#adresse"],
  ["Contact", "#contact"],
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionHref = (href: string) => (href.startsWith("#") && pathname !== "/" ? `/${href}` : href);

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(true);
      return;
    }

    const updateVisibility = () => {
      const scrollThreshold = window.innerHeight * 0.8;
      setVisible(window.scrollY > scrollThreshold);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [pathname]);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      const frame = window.requestAnimationFrame(() => setScrolled(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0.05 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`fixed left-0 top-0 z-50 flex w-full items-center gap-3 border-b px-[3%] py-3 transition-all duration-300 md:gap-7 md:px-[4%] ${
        pathname === "/" && !visible
          ? "pointer-events-none -translate-y-full opacity-0"
          : "pointer-events-auto translate-y-0 opacity-100"
      } ${
        scrolled
          ? "border-black/5 bg-amber-50/90 text-[#171717] shadow-[0_4px_18px_rgba(0,0,0,.05)] backdrop-blur-md"
          : "border-transparent bg-transparent text-white"
      }`}
    >
      <a href={sectionHref("#hero")} className="shrink-0" onClick={() => setOpen(false)}>
        <Image
          src={getPublicImageUrl("/images/amore-33-png.webp")}
          alt="Amore Italiano Safi"
          width={940}
          height={327}
          sizes="(max-width: 768px) 78px, 190px"
          priority
          className="h-12 w-[78px] object-contain object-left md:h-[68px] md:w-[190px]"
        />
      </a>
      <div
        className={`${open ? "absolute left-0 top-full flex" : "hidden"} w-full flex-col gap-5 border-b border-black/5 bg-amber-50 px-6 py-5 text-sm font-semibold md:static md:ml-auto md:mr-auto md:flex md:w-auto md:flex-row md:border-0 md:bg-transparent md:p-0`}
      >
        {links.map(([label, href]) => (
          <a
            key={href}
            href={sectionHref(href)}
            onClick={() => setOpen(false)}
            className={`transition-colors hover:text-[#a92e27] ${scrolled ? "text-[#171717]" : "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]"}`}
          >
            {label}
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Ouvrir le menu"
        className={`ml-auto rounded-full border px-3 py-2 text-xs md:hidden ${scrolled ? "border-[#171717]" : "border-white"}`}
      >
        ☰
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("open-work-modal"))}
        className={`rounded-full border px-3 py-2 text-[9px] font-bold tracking-wider !text-white transition hover:-translate-y-0.5 md:px-4 md:text-[11px] ${scrolled ? "border-[#a92e27] bg-[#a92e27]" : "border-white bg-transparent"}`}
      >
        TRAVAILLER AVEC NOUS
      </button>
      <a
        className={`hidden rounded-full border px-4 py-2 text-[11px] font-bold tracking-wider !text-white transition hover:-translate-y-0.5 sm:inline-flex ${scrolled ? "border-[#596246] bg-[#596246]" : "border-white bg-transparent"}`}
        href="https://wa.me/212658663376?text=Bonjour%20Amore%20Italiano%20Safi%2C%20je%20souhaite%20vous%20contacter."
        target="_blank"
        rel="noopener"
      >
        CONTACTEZ-NOUS
      </a>
    </nav>
  );
}
