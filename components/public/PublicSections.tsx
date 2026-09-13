import Image from "next/image";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";

export function Stats() {
  return (
    <div className="mx-auto grid w-[92%] max-w-[1180px] grid-cols-1 border-y border-[#ded8cc] py-8 md:grid-cols-3">
      {[
        ["2013", "L'aventure commence"],
        ["2019", "Arrivée à Safi"],
        ["11h — 23h", "Tous les jours"],
      ].map(([value, label]) => (
        <div key={value} className="text-center">
          <strong className="serif block text-4xl">{value}</strong>
          <span className="text-xs uppercase tracking-widest text-[#4a4741]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Highlights() {
  const cards = [
    ["amore-22-jpg.webp", "Pizza", "Des recettes italiennes pour toutes les envies."],
    ["amore-23-jpg.webp", "Caffè", "Une pause café au cœur de Safi."],
    ["amore-24-jpg.webp", "Gelato", "La glace italienne pour finir en beauté."],
    ["amore-25-jpg.webp", "Drinks", "Jus, milk-shakes et boissons fraîches."],
  ] as const;

  return (
    <section className="py-25">
      <div className="mx-auto w-[92%] max-w-[1180px]">
        <SectionHeader
          title={
            <>
              I nostri
              <br />
              incontournables.
            </>
          }
        >
          Les saveurs qui font l&apos;identité d&apos;Amore Italiano : simples,
          généreuses et préparées avec passion.
        </SectionHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([image, title, description]) => (
            <Reveal key={title} className="overflow-hidden rounded-xl bg-[#eee8dc]">
              <Image
                src={`/images/${image}`}
                alt={title}
                width={1367}
                height={2048}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="h-[250px] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="serif text-2xl">{title}</h3>
                <p className="mt-1 text-sm text-[#4a4741]">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" className="py-25">
      <div className="mx-auto w-[92%] max-w-[1180px]">
        <SectionHeader
          title={
            <>
              On vous
              <br />
              attend. ❤️
            </>
          }
        >
          Une question ? Une réservation ? N&apos;hésitez pas à nous contacter.
        </SectionHeader>
        <div className="flex flex-wrap gap-3">
          <a
            className="rounded-full bg-[#a92e27] px-6 py-3 text-sm font-bold !text-white"
            href="tel:+212524628897"
          >
            APPELER MAINTENANT
          </a>
          <a
            className="rounded-full border border-[#171717] px-6 py-3 text-sm font-bold"
            target="_blank"
            rel="noreferrer"
            href="https://www.instagram.com/amoreitaliano.safi/"
          >
            INSTAGRAM · @amoreitaliano.safi
          </a>
        </div>
      </div>
    </section>
  );
}
