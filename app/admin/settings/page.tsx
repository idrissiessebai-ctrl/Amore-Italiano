import type { Metadata } from "next";
import SafiSettingsCard from "@/components/admin/SafiSettingsCard";
import { updateRestaurantSetting } from "@/app/actions/cms";
import { supabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Paramètres du restaurant" };
export const dynamic = "force-dynamic";

const fields = [
  ["opening_hours", "Horaires d'ouverture", "11h00 — 23h00", "Ce qui apparaît dans vos horaires publics."],
  ["phone_numbers", "Numéros de téléphone", "", "Les numéros affichés dans la page contact."],
  ["announcement", "Bannière d'annonce", "", "Un message court visible dans la communication du site."],
] as const;

type Setting = { key: string; value: unknown };

function getSettingValue(settings: Setting[], key: string, fallback = "") {
  const setting = settings.find((item) => item.key === key);
  if (!setting?.value || typeof setting.value !== "object" || !("value" in setting.value)) {
    return fallback;
  }
  return typeof setting.value.value === "string" ? setting.value.value : fallback;
}

export default async function AdminSettingsPage() {
  await assertAdmin();
  const { data: settingsData } = await supabase.from("restaurant_settings").select("key, value");
  const settings = (settingsData ?? []) as Setting[];

  return (
    <section className="mx-auto w-[92%] max-w-[1180px] py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#a92e27]">Centre de contrôle</p>
          <h1 className="serif text-6xl leading-none">Paramètres.</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#6e6a61]">Organisez les informations pratiques et visualisez les contenus qui seront présentés à vos visiteurs.</p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {fields.map(([key, label, fallback, hint]) => (
          <form key={key} action={updateRestaurantSetting.bind(null, key)} className="group flex flex-col rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-[0_12px_35px_rgba(23,23,23,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(23,23,23,0.08)]">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#a92e27]">Information du site</p>
                <h2 className="serif text-2xl">{label}</h2>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f2e8] text-sm text-[#a92e27]">{key === "opening_hours" ? "◷" : key === "phone_numbers" ? "⌕" : "✦"}</span>
            </div>
            <p className="mb-4 min-h-10 text-xs leading-5 text-[#6e6a61]">{hint}</p>
            <textarea name="value" aria-label={label} defaultValue={getSettingValue(settings, key, fallback)} rows={key === "announcement" ? 4 : 3} className="min-h-24 flex-1 resize-y rounded-xl border border-[#ded8cc] bg-[#fffdf8] p-3 text-sm outline-none transition placeholder:text-[#9a9388] focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" />
            <button className="mt-5 w-full rounded-full bg-[#a92e27] px-5 py-3 text-sm font-bold !text-white transition hover:bg-[#8f241f]">ENREGISTRER</button>
          </form>
        ))}
      </div>
    </section>
  );
}
