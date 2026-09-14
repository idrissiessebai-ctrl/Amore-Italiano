const PUBLIC_ASSETS_BUCKET = "public-assets";

export function getPublicImageUrl(src: string) {
  if (src.startsWith("http")) return src;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return src;

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PUBLIC_ASSETS_BUCKET}/${src.replace(/^\//, "")}`;
}
