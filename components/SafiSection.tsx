import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSafiContent } from "@/lib/safi-server";

const cardStyles = ["-rotate-3", "rotate-3", "-rotate-2", "rotate-2"];
const cardLabels = ["Le port", "La médina", "La poterie", "L'Atlantique"];
const fallbackImages = [
  "/images/amore-22-jpg.webp",
  "/images/amore-23-jpg.webp",
  "/images/amore-24-jpg.webp",
  "/images/amore-25-jpg.webp",
];

function publicSafiImageUrl(image: string) {
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  return supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/menu-images/${image.replace(/^\/+/, "")}`
    : image;
}

export async function SafiSection() {
  const [{ data }, safiContent] = await Promise.all([
    supabase
      .from("restaurant_settings")
      .select("key, value")
      .in("key", ["safi_title", "safi_description", "safi_button_text", "safi_button_link"]),
    getSafiContent(),
  ]);
  const settings = data ?? [];

  function value(key: string, fallback = "") {
    const setting = settings.find((item) => item.key === key);
    if (!setting?.value || typeof setting.value !== "object" || !("value" in setting.value)) return fallback;
    return typeof setting.value.value === "string" ? setting.value.value : fallback;
  }

  const configuredImages = safiContent.gallery.images.map((image) => image.url);
  const images = Array.from({ length: 4 }, (_, index) => publicSafiImageUrl(configuredImages[index] || fallbackImages[index]));
  const title = value("safi_title", "Une ville authentique.");
  const description = value("safi_description", "Safi possède une identité particulière, entre médina, remparts, ateliers de potiers et océan Atlantique.");
  const buttonText = value("safi_button_text", "DÉCOUVRIR SAFI");
  const buttonLink = value("safi_button_link", "/safi");

  return (
    <section id="safi" className="overflow-hidden bg-[#f7f2e8] py-25">
      <div className="mx-auto w-[92%] max-w-[1180px]">
        <div className="mb-12 max-w-[650px]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#a92e27]">Ciao, Safi.</p>
          <h2 className="serif text-[clamp(42px,6vw,70px)] leading-none">{title}</h2>
          <p className="mt-5 leading-7 text-[#4a4741]">{description}</p>
        </div>

        <div className="group/gallery grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {images.map((image, index) => (
            <article
              key={`${image}-${index}`}
              className={`group/card relative min-h-[360px] overflow-hidden rounded-xl bg-[#e8e1d4] shadow-md transition-all duration-300 group-hover/gallery:scale-95 group-hover/gallery:opacity-70 group-hover/gallery:brightness-75 hover:z-10 hover:scale-105 hover:opacity-100 hover:brightness-100 ${cardStyles[index]}`}
            >
              <Image
                src={image}
                alt={`${cardLabels[index]} — Safi`}
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover/card:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/75">{cardLabels[index]}</p>
                <Link
                  href={buttonLink || "/safi"}
                  className="inline-flex items-center rounded-full bg-[#a92e27] px-4 py-2 text-[11px] font-bold uppercase tracking-[.08em] !text-white transition hover:bg-[#86221e]"
                >
                  {buttonText}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
