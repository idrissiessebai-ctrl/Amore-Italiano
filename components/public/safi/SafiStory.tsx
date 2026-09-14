import Image from "next/image";
import Link from "next/link";
import SafiGallery from "@/components/public/safi/SafiGallery";
import { getSafiContent } from "@/lib/safi-server";
import { getPublicImageUrl } from "@/lib/utils/image";

function StorySection({
  eyebrow,
  title,
  children,
  facts,
  light = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
  facts: readonly [string, string][];
  light?: boolean;
}) {
  return (
    <section className={light ? "bg-white py-24" : "py-24"}>
      <div className="mx-auto grid w-[92%] max-w-[1180px] items-start gap-12 md:grid-cols-[.9fr_1.1fr] md:gap-16">
        <div>
          <div className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#a92e27]">
            {eyebrow}
          </div>
          <h2 className="serif text-[clamp(42px,5vw,64px)] leading-none">{title}</h2>
        </div>
        <div>
          <div className="text-base leading-8 text-[#6e6a61]">{children}</div>
          <ul className="mt-6">
            {facts.map(([label, description]) => (
              <li key={label} className="flex gap-6 border-t border-[#ded8cc] py-5">
                <strong className="serif min-w-20 text-2xl">{label}</strong>
                <span className="text-sm leading-6 text-[#6e6a61]">{description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default async function SafiStory() {
  const content = await getSafiContent();

  return (
    <>
      <header className="overflow-hidden bg-[#f7f2e8] pb-20 pt-36 md:pb-24 md:pt-44">
        <div className="mx-auto grid w-[92%] max-w-[1180px] items-center gap-12 md:grid-cols-[1.05fr_.95fr] md:gap-16">
          <div>
            <div className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#a92e27]">
              {content.hero.eyebrow}
            </div>
            <h1 className="serif mb-6 text-[clamp(56px,8vw,100px)] leading-[.92]">{content.hero.title}</h1>
            <p className="max-w-[650px] text-lg leading-8 text-[#6e6a61]">
              {content.hero.description}
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex rounded-full border border-[#171717] px-5 py-3 text-xs font-bold transition hover:bg-[#171717] hover:!text-white"
            >
              ← RETOUR À L&apos;ACCUEIL
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#e8e1d4] shadow-[0_20px_50px_rgba(0,0,0,.12)]">
            <Image
              src={getPublicImageUrl(content.hero.image)}
              alt={content.hero.alt}
              fill
              priority
              sizes="(max-width: 768px) 92vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      </header>

      <main>
        <section className="py-24">
          <div className="mx-auto w-[92%] max-w-[1180px]">
            <div className="mb-14 max-w-[780px]">
              <div className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#a92e27]">
                {content.history.eyebrow}
              </div>
              <h2 className="serif text-[clamp(42px,6vw,72px)] leading-[.98]">{content.history.title}</h2>
              <p className="mt-5 leading-8 text-[#6e6a61]">
                {content.history.description}
              </p>
            </div>
            <div className="grid gap-[18px] md:grid-cols-2">
              {content.history.timeline.map((item, index) => (
                <article
                  key={`${item.year}-${index}`}
                  className={`min-h-[230px] border border-[#ded8cc] bg-white p-8 ${index === 1 ? "bg-[#596246] text-white" : ""}`}
                >
                  <div className={`text-xs font-bold uppercase tracking-[.16em] ${index === 1 ? "text-white" : "text-[#a92e27]"}`}>
                    {item.year}
                  </div>
                  <h3 className="serif mt-3 text-3xl">{item.title}</h3>
                  <p className={`mt-3 leading-7 ${index === 1 ? "text-white/80" : "text-[#6e6a61]"}`}>
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <StorySection
          eyebrow={content.patrimoine.eyebrow}
          title={content.patrimoine.title}
          facts={content.patrimoine.facts.map((fact) => [fact.label, fact.description] as [string, string])}
          light
        >
          {content.patrimoine.description}
        </StorySection>

        <StorySection
          eyebrow={content.savoirFaire.eyebrow}
          title={content.savoirFaire.title}
          facts={content.savoirFaire.facts.map((fact) => [fact.label, fact.description] as [string, string])}
        >
          {content.savoirFaire.description}
        </StorySection>

        <SafiGallery content={content.gallery} />
      </main>
    </>
  );
}
