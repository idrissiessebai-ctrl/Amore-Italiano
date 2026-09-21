import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "#histoire", "#menu", "safi", "#safi", "#adresse", "#contact"].map(
    (path) => ({
      url: `https://amoreitaliano.ma/${path}`,
      lastModified: new Date(),
    }),
  );
}
