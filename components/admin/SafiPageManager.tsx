"use client";

import { ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteSafiImage, updateSafiPageContent, uploadSafiImage } from "@/app/actions/cms";
import type { SafiContent, SafiFact, SafiGalleryImage, SafiTimelineItem } from "@/lib/safi";
import { getPublicImageUrl } from "@/lib/utils/image";

export default function SafiPageManager({ initialContent }: { initialContent: SafiContent }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [uploading, setUploading] = useState(false);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);
  const [saving, startSaving] = useTransition();

  function updateSection<K extends keyof SafiContent>(section: K, key: keyof SafiContent[K], value: string) {
    setContent((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.set("image", file);
    const result = await uploadSafiImage(formData);
    if ("error" in result || !result.url) throw new Error(result.error ?? "Impossible de téléverser l'image.");
    return result.url;
  }

  async function handleHeroUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPendingUploads((current) => [...current, url]);
      if (content.hero.image && content.hero.image !== url) {
        setRemovedUrls((current) => [...new Set([...current, content.hero.image])]);
      }
      updateSection("hero", "image", url);
      toast.success("Image principale remplacée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de téléverser l'image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleGalleryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(uploadImage));
      setPendingUploads((current) => [...current, ...uploaded]);
      setContent((current) => ({
        ...current,
        gallery: {
          ...current.gallery,
          images: [...current.gallery.images, ...uploaded.map((url) => ({ url, alt: "Photo de Safi", caption: "Safi" }))].slice(0, 30),
        },
      }));
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} ajoutée${uploaded.length > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de téléverser les photos.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeGalleryImage(url: string) {
    setContent((current) => ({ ...current, gallery: { ...current.gallery, images: current.gallery.images.filter((image) => image.url !== url) } }));
    setRemovedUrls((current) => [...new Set([...current, url])]);
    toast.success("Photo retirée. Enregistrez la page pour confirmer.");
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    setContent((current) => {
      const images = [...current.gallery.images];
      const target = index + direction;
      if (target < 0 || target >= images.length) return current;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, gallery: { ...current.gallery, images } };
    });
  }

  function updateTimeline(index: number, key: keyof SafiTimelineItem, value: string) {
    setContent((current) => ({
      ...current,
      history: { ...current.history, timeline: current.history.timeline.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) },
    }));
  }

  function updateFacts(section: "patrimoine" | "savoirFaire", index: number, key: keyof SafiFact, value: string) {
    setContent((current) => ({
      ...current,
      [section]: { ...current[section], facts: current[section].facts.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("safi_hero_eyebrow", content.hero.eyebrow);
    formData.set("safi_hero_title", content.hero.title);
    formData.set("safi_hero_description", content.hero.description);
    formData.set("safi_hero_image", getPublicImageUrl(content.hero.image));
    formData.set("safi_hero_image_alt", content.hero.alt);
    formData.set("safi_history_eyebrow", content.history.eyebrow);
    formData.set("safi_history_title", content.history.title);
    formData.set("safi_history_description", content.history.description);
    formData.set("safi_history_timeline", JSON.stringify(content.history.timeline));
    formData.set("safi_patrimoine_eyebrow", content.patrimoine.eyebrow);
    formData.set("safi_patrimoine_title", content.patrimoine.title);
    formData.set("safi_patrimoine_description", content.patrimoine.description);
    formData.set("safi_patrimoine_facts", JSON.stringify(content.patrimoine.facts));
    formData.set("safi_savoir_eyebrow", content.savoirFaire.eyebrow);
    formData.set("safi_savoir_title", content.savoirFaire.title);
    formData.set("safi_savoir_description", content.savoirFaire.description);
    formData.set("safi_savoir_facts", JSON.stringify(content.savoirFaire.facts));
    formData.set("safi_gallery_eyebrow", content.gallery.eyebrow);
    formData.set("safi_gallery_title", content.gallery.title);
    formData.set("safi_gallery_description", content.gallery.description);
    formData.set(
      "safi_gallery_images",
      JSON.stringify(content.gallery.images.map((image) => ({ ...image, url: getPublicImageUrl(image.url) }))),
    );

    startSaving(async () => {
      try {
        await updateSafiPageContent(formData);
        router.refresh();
        const cleanup = await Promise.allSettled(removedUrls.map((url) => deleteSafiImage(url)));
        setRemovedUrls([]);
        setPendingUploads([]);
        if (cleanup.some((result) => result.status === "rejected")) {
          toast.warning("La page est enregistrée, mais certaines anciennes images n'ont pas pu être supprimées du stockage.");
        } else {
          toast.success("La page Safi a été enregistrée.");
        }
      } catch (error) {
        await Promise.allSettled(pendingUploads.map((url) => deleteSafiImage(url)));
        setPendingUploads([]);
        toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la page Safi.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#a92e27]">CMS Safi</p>
          <h1 className="serif text-5xl leading-none">La page Safi.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6e6a61]">Modifiez les contenus de chaque section sans toucher au design public. Les changements sont publiés après enregistrement.</p>
        </div>
        <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-full bg-[#a92e27] px-5 py-3 text-sm font-bold !text-white transition hover:bg-[#8f241f] disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "ENREGISTREMENT..." : "ENREGISTRER LA PAGE"}
        </button>
      </div>

      <section className="rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-sm">
        <SectionTitle eyebrow="01 · Introduction" title="En-tête de la page" description="Le premier écran visible à l'arrivée sur /safi." />
        <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="relative min-h-64 overflow-hidden rounded-xl bg-[#e8e1d4]">
            <img src={getPublicImageUrl(content.hero.image || "/images/amore-32-jpg.webp")} alt="Aperçu de l'en-tête Safi" className="absolute inset-0 h-full w-full object-cover" />
            <label className="absolute bottom-3 left-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[#171717] shadow">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Remplacer l&apos;image
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleHeroUpload} disabled={uploading} className="sr-only" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Surtitre" value={content.hero.eyebrow} onChange={(value) => updateSection("hero", "eyebrow", value)} />
            <Field label="Titre" value={content.hero.title} onChange={(value) => updateSection("hero", "title", value)} />
            <TextField className="sm:col-span-2" label="Description" value={content.hero.description} onChange={(value) => updateSection("hero", "description", value)} />
            <Field className="sm:col-span-2" label="Texte alternatif de l'image" value={content.hero.alt} onChange={(value) => updateSection("hero", "alt", value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-sm">
        <SectionTitle eyebrow="02 · Histoire" title="Histoire et chronologie" description="Le texte d'introduction et les cartes chronologiques de la page." />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Surtitre" value={content.history.eyebrow} onChange={(value) => updateSection("history", "eyebrow", value)} />
          <Field label="Titre" value={content.history.title} onChange={(value) => updateSection("history", "title", value)} />
          <TextField className="md:col-span-2" label="Introduction" value={content.history.description} onChange={(value) => updateSection("history", "description", value)} />
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between"><h3 className="serif text-2xl">Étapes de la chronologie</h3><button type="button" onClick={() => setContent((current) => ({ ...current, history: { ...current.history, timeline: [...current.history.timeline, { year: "Nouvelle date", title: "Nouveau titre", description: "Nouvelle description" }] } }))} className="inline-flex items-center gap-1 rounded-full border border-[#596246] px-3 py-2 text-xs font-bold text-[#596246]"><Plus size={14} /> Ajouter</button></div>
          {content.history.timeline.map((item, index) => (
            <div key={`${index}-${item.year}`} className="grid gap-3 rounded-xl border border-[#ded8cc] bg-[#fffdf8] p-4 md:grid-cols-[.35fr_.65fr]">
              <Field label="Date" value={item.year} onChange={(value) => updateTimeline(index, "year", value)} />
              <Field label="Titre" value={item.title} onChange={(value) => updateTimeline(index, "title", value)} />
              <TextField className="md:col-span-2" label="Description" value={item.description} onChange={(value) => updateTimeline(index, "description", value)} />
            </div>
          ))}
        </div>
      </section>

      <ContentSectionEditor title="Patrimoine" eyebrow={content.patrimoine.eyebrow} description={content.patrimoine.description} section={content.patrimoine} onEyebrow={(value) => updateSection("patrimoine", "eyebrow", value)} onTitle={(value) => updateSection("patrimoine", "title", value)} onDescription={(value) => updateSection("patrimoine", "description", value)} onFact={updateFacts.bind(null, "patrimoine")} />
      <ContentSectionEditor title="Savoir-faire" eyebrow={content.savoirFaire.eyebrow} description={content.savoirFaire.description} section={content.savoirFaire} onEyebrow={(value) => updateSection("savoirFaire", "eyebrow", value)} onTitle={(value) => updateSection("savoirFaire", "title", value)} onDescription={(value) => updateSection("savoirFaire", "description", value)} onFact={updateFacts.bind(null, "savoirFaire")} />

      <section className="rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-sm">
        <SectionTitle eyebrow="05 · Galerie" title="Images, textes et ordre" description="Ces images alimentent la galerie publique. Utilisez les flèches pour modifier leur ordre d'affichage." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field label="Surtitre" value={content.gallery.eyebrow} onChange={(value) => updateSection("gallery", "eyebrow", value)} />
          <Field label="Titre" value={content.gallery.title} onChange={(value) => updateSection("gallery", "title", value)} />
          <TextField className="md:col-span-3" label="Description" value={content.gallery.description} onChange={(value) => updateSection("gallery", "description", value)} />
        </div>
        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#596246] px-4 py-2 text-xs font-bold text-[#596246] transition hover:bg-[#596246] hover:text-white">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          Ajouter des images
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleGalleryUpload} disabled={uploading} className="sr-only" />
        </label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.gallery.images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="overflow-hidden rounded-xl border border-[#ded8cc] bg-[#fffdf8]">
              <div className="relative aspect-[4/3] bg-[#e8e1d4]"><img src={getPublicImageUrl(image.url)} alt={image.alt} className="h-full w-full object-cover" /></div>
              <div className="space-y-2 p-3">
                <Field label="Légende" value={image.caption} onChange={(value) => setContent((current) => ({ ...current, gallery: { ...current.gallery, images: current.gallery.images.map((item, itemIndex) => itemIndex === index ? { ...item, caption: value } : item) } }))} />
                <Field label="Texte alternatif" value={image.alt} onChange={(value) => setContent((current) => ({ ...current, gallery: { ...current.gallery, images: current.gallery.images.map((item, itemIndex) => itemIndex === index ? { ...item, alt: value } : item) } }))} />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1"><IconButton label="Monter" disabled={index === 0} onClick={() => moveGalleryImage(index, -1)}><ChevronUp size={16} /></IconButton><IconButton label="Descendre" disabled={index === content.gallery.images.length - 1} onClick={() => moveGalleryImage(index, 1)}><ChevronDown size={16} /></IconButton></div>
                  <IconButton label="Supprimer" disabled={saving} onClick={() => removeGalleryImage(image.url)} danger><Trash2 size={16} /></IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#a92e27]">{eyebrow}</p><h2 className="serif text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6a61]">{description}</p></div>;
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return <label className={`block text-xs font-bold text-[#4a4741] ${className}`}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#ded8cc] bg-white p-2.5 text-sm font-normal outline-none focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" /></label>;
}

function TextField({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return <label className={`block text-xs font-bold text-[#4a4741] ${className}`}>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-1.5 w-full resize-y rounded-lg border border-[#ded8cc] bg-white p-2.5 text-sm font-normal outline-none focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" /></label>;
}

function IconButton({ label, disabled, onClick, children, danger = false }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`rounded-full p-2 transition disabled:opacity-30 ${danger ? "text-[#a92e27] hover:bg-[#a92e27] hover:text-white" : "text-[#596246] hover:bg-[#596246] hover:text-white"}`}>{children}</button>;
}

function ContentSectionEditor({ title, eyebrow, description, section, onEyebrow, onTitle, onDescription, onFact }: { title: string; eyebrow: string; description: string; section: { title: string; facts: SafiFact[] }; onEyebrow: (value: string) => void; onTitle: (value: string) => void; onDescription: (value: string) => void; onFact: (index: number, key: keyof SafiFact, value: string) => void }) {
  return <section className="rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-sm"><SectionTitle eyebrow="03 · Section de contenu" title={title} description="Le texte éditorial et les informations mises en avant sur la page publique." /><div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Surtitre" value={eyebrow} onChange={onEyebrow} /><Field label="Titre" value={section.title} onChange={onTitle} /><TextField className="md:col-span-2" label="Texte de section" value={description} onChange={onDescription} /></div><div className="mt-6 grid gap-3 md:grid-cols-2">{section.facts.map((fact, index) => <div key={`${index}-${fact.label}`} className="rounded-xl border border-[#ded8cc] bg-[#fffdf8] p-4"><Field label="Repère" value={fact.label} onChange={(value) => onFact(index, "label", value)} /><TextField className="mt-3" label="Description" value={fact.description} onChange={(value) => onFact(index, "description", value)} /></div>)}</div></section>;
}
