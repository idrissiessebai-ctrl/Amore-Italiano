"use client";

import { Trash2, Upload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { getPublicImageUrl } from "@/lib/utils/image";
import {
  deleteSafiImage,
  updateSafiSettings,
  uploadSafiImage,
} from "@/app/actions/cms";

type SafiSettings = {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  images: string[];
};

const fallbackImage = "/images/amore-32-jpg.webp";

export default function SafiSettingsCard({
  initialSettings,
  className = "",
}: {
  initialSettings: SafiSettings;
  className?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialSettings.title);
  const [description, setDescription] = useState(initialSettings.description);
  const [buttonText, setButtonText] = useState(initialSettings.buttonText);
  const [buttonLink, setButtonLink] = useState(initialSettings.buttonLink);
  const [images, setImages] = useState(initialSettings.images);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.set("image", file);
        const result = await uploadSafiImage(formData);
        if ("error" in result) throw new Error(result.error);
        if (result.url) uploaded.push(result.url);
      }
      setImages((current) => [...current, ...uploaded].slice(0, 30));
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} ajoutée${uploaded.length > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de téléverser les images.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleRemove(url: string) {
    setDeletingImage(url);
    startSaving(async () => {
      try {
        await deleteSafiImage(url);
        setImages((current) => current.filter((image) => image !== url));
        toast.success("Image supprimée de la galerie.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible de supprimer l'image.");
      } finally {
        setDeletingImage(null);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("safi_images", JSON.stringify(images.map(getPublicImageUrl)));

    startSaving(async () => {
      try {
        await updateSafiSettings(formData);
        router.refresh();
        toast.success("La présentation et la galerie Safi ont été enregistrées.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer les modifications.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-[0_12px_35px_rgba(23,23,23,0.04)] ${className}`}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#a92e27]">Édition visuelle</p>
          <h2 className="serif text-3xl">Présentation &amp; Galerie Safi</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#6e6a61]">Modifiez les champs directement à côté de leur rendu réel pour comprendre instantanément leur impact.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-[#ded8cc] bg-[#f7f2e8] p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a92e27]">Aperçu en direct</p>
              <p className="mt-1 text-xs text-[#6e6a61]">La section telle qu&apos;elle apparaît sur le site.</p>
            </div>
            <span className="rounded-full border border-[#ded8cc] bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6e6a61]">Safi</span>
          </div>
          <div className="grid overflow-hidden rounded-xl bg-white shadow-sm md:grid-cols-2">
            <div className="relative min-h-64 bg-[#e8e1d4] md:min-h-80">
              <img src={getPublicImageUrl(images[0] || fallbackImage)} alt="Aperçu de la galerie Safi" className="absolute inset-0 h-full w-full object-cover" />
              {images.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white">+{images.length - 1} photos</span>}
            </div>
            <div className="p-6 sm:p-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a92e27]">Ciao, Safi.</p>
              <h3 className="serif text-4xl leading-[.98] text-[#171717]">{title || "Votre titre Safi"}</h3>
              <p className="mt-5 line-clamp-5 text-sm leading-6 text-[#4a4741]">{description || "Votre description apparaîtra ici."}</p>
              <span className="mt-6 inline-block rounded-full bg-[#a92e27] px-5 py-2.5 text-xs font-bold text-white">{buttonText || "TEXTE DU BOUTON"}</span>
              <p className="mt-3 truncate text-[10px] text-[#9a9388]">Lien : {buttonLink || "/safi"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#ded8cc] bg-[#fffdf8] p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a92e27]">Présentation</p>
            <h3 className="serif mt-1 text-2xl">Éléments de la section</h3>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-bold text-[#4a4741]">
              Titre affiché dans l&apos;aperçu
              <input name="safi_title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ded8cc] bg-white p-3 text-sm font-normal outline-none transition focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" />
            </label>
            <label className="block text-xs font-bold text-[#4a4741]">
              Texte sous le titre
              <textarea name="safi_description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-2 w-full resize-y rounded-xl border border-[#ded8cc] bg-white p-3 text-sm font-normal outline-none transition focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[#4a4741]">
                Libellé du bouton
                <input name="safi_button_text" value={buttonText} onChange={(event) => setButtonText(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ded8cc] bg-white p-3 text-sm font-normal outline-none transition focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" />
              </label>
              <label className="block text-xs font-bold text-[#4a4741]">
                Destination du bouton
                <input name="safi_button_link" value={buttonLink} onChange={(event) => setButtonLink(event.target.value)} placeholder="/safi" className="mt-2 w-full rounded-xl border border-[#ded8cc] bg-white p-3 text-sm font-normal outline-none transition focus:border-[#a92e27] focus:ring-4 focus:ring-[#a92e27]/10" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#ded8cc] bg-[#fffdf8] p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a92e27]">Galerie</p>
            <h3 className="serif mt-1 text-2xl">Photos visibles dans le carrousel</h3>
            <p className="text-xs text-[#6e6a61]">JPG, PNG, WebP ou AVIF · 8 Mo maximum par image</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#596246] px-4 py-2 text-xs font-bold text-[#596246] transition hover:bg-[#596246] hover:text-white">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "ENVOI..." : "AJOUTER DES PHOTOS"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleUpload} disabled={uploading} className="sr-only" />
          </label>
        </div>

        {images.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((url) => (
              <div key={url} className="group relative overflow-hidden rounded-lg border border-[#ded8cc] bg-[#f7f2e8]">
                <img src={getPublicImageUrl(url)} alt="Photo de Safi" className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  aria-label="Supprimer cette photo"
                  onClick={() => handleRemove(url)}
                  disabled={deletingImage === url || isSaving}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-[#a92e27] shadow transition hover:bg-[#a92e27] hover:text-white disabled:opacity-60"
                >
                  {deletingImage === url ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#b9b1a4] p-8 text-center text-sm text-[#6e6a61]">
            Aucune photo dans la galerie pour le moment.
          </div>
        )}
      </div>

      <button type="submit" disabled={isSaving || uploading} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#a92e27] px-5 py-3 text-sm font-bold !text-white transition hover:bg-[#8f241f] disabled:cursor-not-allowed disabled:opacity-60">
        {isSaving && <Loader2 size={16} className="animate-spin" />}
        {isSaving ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}
      </button>
    </form>
  );
}
