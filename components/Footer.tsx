import Link from "next/link";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/utils/image";
export default function Footer() {
  return (
    <footer className="bg-[#171717] py-15 text-white">
      <div className="mx-auto flex w-[92%] max-w-[1180px] flex-col justify-between gap-7 md:flex-row">
        <div>
          <Image
            src={getPublicImageUrl("/images/amore-33-png.webp")}
            alt="Amore Italiano Safi"
            width={940}
            height={327}
            sizes="190px"
            className="h-[75px] w-[190px] object-contain brightness-0 invert"
          />
          <p>Fatto con tanto amore, dal 2013.</p>
        </div>
        <div>
          <p>Label Gallery · Centre-ville · Safi</p>
          <p>11h00 — 23h00</p>
        </div>
        <div>
          <p>
            <Link href="/histoire">Histoire</Link> ·{" "}
            <Link href="/menu">Menu</Link> · <Link href="/safi">Safi</Link> ·{" "}
            <Link href="/adresse">Adresse</Link> ·{" "}
            <Link href="/contact">Contact</Link>
          </p>
          <p>© 2026 Amore Italiano Safi</p>
        </div>
      </div>
    </footer>
  );
}
