import { getPublicImageUrl } from "@/lib/utils/image";

export type SafiTimelineItem = {
  year: string;
  title: string;
  description: string;
};

export type SafiFact = {
  label: string;
  description: string;
};

export type SafiGalleryImage = {
  url: string;
  alt: string;
  caption: string;
};

export type SafiContent = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    image: string;
    alt: string;
  };
  history: {
    eyebrow: string;
    title: string;
    description: string;
    timeline: SafiTimelineItem[];
  };
  patrimoine: {
    eyebrow: string;
    title: string;
    description: string;
    facts: SafiFact[];
  };
  savoirFaire: {
    eyebrow: string;
    title: string;
    description: string;
    facts: SafiFact[];
  };
  gallery: {
    eyebrow: string;
    title: string;
    description: string;
    images: SafiGalleryImage[];
  };
};

export const defaultSafiContent: SafiContent = {
  hero: {
    eyebrow: "Ciao, Safi · Maroc",
    title: "L'histoire de Safi.",
    description: "Une ville tournée vers l'Atlantique, façonnée par son port, sa médina, ses remparts et son savoir-faire ancestral de la poterie.",
    image: getPublicImageUrl("/images/amore-32-jpg.webp"),
    alt: "Architecture et patrimoine de Safi",
  },
  history: {
    eyebrow: "Un passé entre terre et mer",
    title: "Une ville ancienne, un caractère unique.",
    description: "Safi est une cité portuaire dont l'histoire est intimement liée à l'Atlantique. Le nom d'Asfi apparaît dans les textes arabes à partir du XIe siècle. À l'époque almohade, la ville devient un port important de Marrakech et entretient des relations avec l'Andalousie.",
    timeline: [
      { year: "XIe — XIIe siècles", title: "Asfi, port de l'Atlantique", description: "La ville se développe comme un port d'échanges. Sous les Almohades, Safi est reliée à Marrakech et entretient des échanges maritimes avec l'Andalousie." },
      { year: "1509 — 1541", title: "L'époque portugaise", description: "Les Portugais prennent Safi au début du XVIe siècle et renforcent ses défenses. L'occupation prend fin en 1541 avec la reprise de la ville par les Saadiens." },
      { year: "Après 1541", title: "Un grand port marocain", description: "Safi retrouve une place importante dans les échanges du Royaume. Sa proximité avec Marrakech favorise son rôle commercial et ses relations avec l'Europe." },
      { year: "XXe siècle", title: "Port, pêche et industrie", description: "Le port s'étend notamment avec le développement des exportations de phosphates. La pêche et la conserverie sardinière connaissent également un essor majeur au cours du siècle." },
    ],
  },
  patrimoine: {
    eyebrow: "Patrimoine",
    title: "Le Kechla, mémoire de la ville.",
    description: "Le Kechla et les fortifications portugaises comptent parmi les témoins les plus marquants du passé de Safi. La médina conserve également une architecture et une ambiance profondément marocaines.",
    facts: [
      { label: "Kechla", description: "Un vestige majeur de la période portugaise, dominant l'Atlantique." },
      { label: "Médina", description: "Un patrimoine vivant fait de ruelles, souks, artisans et traditions." },
      { label: "Océan", description: "Le littoral reste au cœur de l'identité de Safi, notamment à travers le surf." },
    ],
  },
  savoirFaire: {
    eyebrow: "Savoir-faire",
    title: "Safi, ville de potiers.",
    description: "La poterie est l'un des symboles culturels de Safi. La ville est reconnue comme l'une des capitales marocaines de la céramique, avec notamment la Colline des Potiers et ses ateliers. Les pièces en terre cuite et les céramiques bleues font partie de son identité artisanale.",
    facts: [
      { label: "Artisanat", description: "Une tradition de poterie et de céramique profondément liée à l'identité de la ville." },
      { label: "Culture", description: "Un patrimoine qui réunit médina, architecture, métiers d'art et vie maritime." },
    ],
  },
  gallery: {
    eyebrow: "Regards sur Safi",
    title: "Une ville à regarder.",
    description: "Quelques images pour découvrir le patrimoine, le port, la médina et l'art de la céramique qui font l'identité de Safi.",
    images: [
      { url: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Port_of_Safi_city%2C_Morocco.jpg", alt: "Le port de Safi et l'Atlantique", caption: "Le port de Safi & l'Atlantique" },
      { url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Safi_medina%28js%29.jpg", alt: "Les remparts et la médina de Safi", caption: "Les remparts et la médina" },
      { url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Museo_Nacional_de_Cer%C3%A1mica%2C_Safi.jpg", alt: "Le Kechla, musée national de la céramique", caption: "Le Kechla — Musée national de la céramique" },
      { url: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Poterie_de_Safi_Maroc_Morocco_Marueccos.JPG", alt: "La poterie traditionnelle de Safi", caption: "La poterie de Safi" },
    ],
  },
};

type Setting = { key: string; value: unknown };

function settingValue(settings: Setting[], key: string) {
  const setting = settings.find((item) => item.key === key);
  if (!setting?.value || typeof setting.value !== "object" || !("value" in setting.value)) return undefined;
  return setting.value.value;
}

function stringValue(settings: Setting[], key: string, fallback: string) {
  const value = settingValue(settings, key);
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

function factsValue(settings: Setting[], key: string, fallback: SafiFact[]) {
  const value = settingValue(settings, key);
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is SafiFact => Boolean(item) && typeof item === "object" && typeof item.label === "string" && item.label.trim().length > 0 && typeof item.description === "string");
}

function timelineValue(settings: Setting[], fallback: SafiTimelineItem[]) {
  const value = settingValue(settings, "safi_history_timeline");
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is SafiTimelineItem => Boolean(item) && typeof item === "object" && typeof item.year === "string" && item.year.trim().length > 0 && typeof item.title === "string" && item.title.trim().length > 0 && typeof item.description === "string");
}

function imagesValue(settings: Setting[], fallback: SafiGalleryImage[]) {
  const value = settingValue(settings, "safi_gallery_images") ?? settingValue(settings, "safi_images");
  if (!Array.isArray(value)) return fallback;
  return value.flatMap((item): SafiGalleryImage[] => {
    if (typeof item === "string" && item.trim()) return [{ url: item.trim(), alt: "Photo de Safi", caption: "Safi" }];
    if (item && typeof item === "object" && typeof item.url === "string" && item.url.trim()) {
      return [{ url: item.url.trim(), alt: typeof item.alt === "string" && item.alt.trim() ? item.alt.trim() : "Photo de Safi", caption: typeof item.caption === "string" && item.caption.trim() ? item.caption.trim() : "Safi" }];
    }
    return [];
  });
}

export function readSafiContent(settings: Setting[]): SafiContent {
  return {
    hero: {
      eyebrow: stringValue(settings, "safi_hero_eyebrow", defaultSafiContent.hero.eyebrow),
      title: stringValue(settings, "safi_hero_title", defaultSafiContent.hero.title),
      description: stringValue(settings, "safi_hero_description", defaultSafiContent.hero.description),
      image: stringValue(settings, "safi_hero_image", defaultSafiContent.hero.image),
      alt: stringValue(settings, "safi_hero_image_alt", defaultSafiContent.hero.alt),
    },
    history: {
      eyebrow: stringValue(settings, "safi_history_eyebrow", defaultSafiContent.history.eyebrow),
      title: stringValue(settings, "safi_history_title", defaultSafiContent.history.title),
      description: stringValue(settings, "safi_history_description", defaultSafiContent.history.description),
      timeline: timelineValue(settings, defaultSafiContent.history.timeline),
    },
    patrimoine: {
      eyebrow: stringValue(settings, "safi_patrimoine_eyebrow", defaultSafiContent.patrimoine.eyebrow),
      title: stringValue(settings, "safi_patrimoine_title", defaultSafiContent.patrimoine.title),
      description: stringValue(settings, "safi_patrimoine_description", defaultSafiContent.patrimoine.description),
      facts: factsValue(settings, "safi_patrimoine_facts", defaultSafiContent.patrimoine.facts),
    },
    savoirFaire: {
      eyebrow: stringValue(settings, "safi_savoir_eyebrow", defaultSafiContent.savoirFaire.eyebrow),
      title: stringValue(settings, "safi_savoir_title", defaultSafiContent.savoirFaire.title),
      description: stringValue(settings, "safi_savoir_description", defaultSafiContent.savoirFaire.description),
      facts: factsValue(settings, "safi_savoir_facts", defaultSafiContent.savoirFaire.facts),
    },
    gallery: {
      eyebrow: stringValue(settings, "safi_gallery_eyebrow", defaultSafiContent.gallery.eyebrow),
      title: stringValue(settings, "safi_gallery_title", defaultSafiContent.gallery.title),
      description: stringValue(settings, "safi_gallery_description", defaultSafiContent.gallery.description),
      images: imagesValue(settings, defaultSafiContent.gallery.images),
    },
  };
}
