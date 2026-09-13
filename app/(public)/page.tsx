import Gallery from "@/components/Gallery";
import PublicMenu from "@/components/PublicMenu";
import { SafiSection } from "@/components/SafiSection";
import { Story, Location } from "@/components/ContentSections";
import Hero from "@/components/public/Hero";
import {
  ContactSection,
  Highlights,
  Stats,
} from "@/components/public/PublicSections";
import SectionHeader from "@/components/SectionHeader";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name")
      .order("display_order"),
    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price_small, price_medium, price_large, is_available, image_url")
      .order("display_order"),
  ]);

  return (
    <>
      <Hero />
      <Stats />
      <Highlights />
      <Story />
      <section id="menu" className="scroll-mt-24 py-25">
        <div className="mx-auto w-[92%] max-w-[1180px]">
          <SectionHeader title="Menu.">
            L&apos;Italie dans votre assiette. Découvrez nos pizzas, cafés, jus et
            spécialités.
          </SectionHeader>
          <PublicMenu categories={categories ?? []} items={items ?? []} />
        </div>
      </section>
      <section id="creations" className="scroll-mt-24 py-25">
        <div className="mx-auto w-[92%] max-w-[1180px]">
          <SectionHeader kicker="En images" title="Nos créations.">
            Un aperçu de nos desserts, glaces et plats, directement depuis notre
            atelier.
          </SectionHeader>
          <Gallery />
        </div>
      </section>
      <SafiSection />
      <Location />
      <ContactSection />
    </>
  );
}
