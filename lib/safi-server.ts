import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { defaultSafiContent, readSafiContent } from "@/lib/safi";

const SAFI_CONTENT_TAG = "safi-page-content";

function safiGalleryImagesFromSettings(settings: { key: string; value: unknown }[]) {
  const setting = settings.find((item) => item.key === "safi_gallery_images");
  if (!setting?.value || typeof setting.value !== "object" || !("value" in setting.value)) return [];

  const value = setting.value.value;
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    if (typeof item.url !== "string" || !item.url.trim()) return [];

    return [{
      url: item.url.trim(),
      alt: typeof item.alt === "string" && item.alt.trim() ? item.alt.trim() : "Photo de Safi",
      caption: typeof item.caption === "string" && item.caption.trim() ? item.caption.trim() : "Safi",
    }];
  });
}

const loadSafiContent = unstable_cache(
  async () => {
    try {
      const { data, error } = await supabase.from("restaurant_settings").select("key, value");
      if (error) throw error;
      
      const settings = (data ?? []) as { key: string; value: unknown }[];
      const content = readSafiContent(settings);
      let galleryImages = safiGalleryImagesFromSettings(settings);

      if (galleryImages.length === 0) {
        const { data: files, error: storageError } = await supabase.storage
          .from("public-assets")
          .list("safi", {
            limit: 20,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (!storageError && files) {
          galleryImages = files
            .filter((file) => file.name !== ".emptyFolderPlaceholder" && !file.name.startsWith("."))
            .map((file) => ({
              url: `safi/${file.name}`,
              alt: "Galerie Safi",
              caption: "Safi",
            }));
        }
      }

      return galleryImages.length > 0 
        ? { ...content, gallery: { ...content.gallery, images: galleryImages } } 
        : content;
        
    } catch (error) {
      return defaultSafiContent;
    }
  },
  [SAFI_CONTENT_TAG],
  { revalidate: 300, tags: [SAFI_CONTENT_TAG] },
);

export function getSafiContent() {
  return loadSafiContent();
}
