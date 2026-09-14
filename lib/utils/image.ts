const PUBLIC_ASSETS_BUCKET = "public-assets";

export function getPublicImageUrl(src: string) {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;

  const cleaned = src
    .trim()
    .replace(/^\/+/, "")
    .replace(/^images\//i, "")
    .replace(/^menu-images\//i, "");

  const normalized = cleaned.replace(/^(?:public-assets\/)+/i, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return normalized;

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_ASSETS_BUCKET}/${normalized}`;
}
