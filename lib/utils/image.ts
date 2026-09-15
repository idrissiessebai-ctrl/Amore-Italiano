const PUBLIC_ASSETS_BUCKET = "public-assets";

export function getPublicImageUrl(src: string) {
  if (!src) return src;
  
  if (/^https?:\/\//i.test(src)) return src;

  if (src.startsWith("/images/") || src.startsWith("images/")) {
    return src.startsWith("/") ? src : `/${src}`;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return src.startsWith("/") ? src : `/${src}`;

  const cleaned = src
    .trim()
    .replace(/^\/+/, "")
    .replace(/^public-assets\//i, "");

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_ASSETS_BUCKET}/${cleaned}`;
}