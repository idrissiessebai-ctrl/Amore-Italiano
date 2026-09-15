"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safiText(formData: FormData, key: string, maxLength: number) {
  const value = text(formData, key);
  if (value.length > maxLength) {
    throw new Error(`Le champ ${key} est trop long.`);
  }
  return value;
}

function number(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function menuPrice(formData: FormData, key: string) {
  const value = number(formData, key, -1);
  if (value < 0) throw new Error("Le prix du plat est obligatoire.");
  return value;
}

function optionalMenuPrice(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Le prix doit être un nombre positif.");
  }
  return value;
}

function validatePriceSet(priceMedium: number | null, priceLarge: number | null) {
  if ((priceMedium === null) !== (priceLarge === null)) {
    throw new Error("Renseignez les prix M et L ensemble, ou laissez-les vides pour un prix unique.");
  }
}

const MAX_MENU_IMAGE_SIZE = 8 * 1024 * 1024;

function hasValidImageSignature(buffer: Buffer, type: string) {
  const isJpeg = type === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = type === "image/webp" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  const isAvif = type === "image/avif" && buffer.subarray(4, 12).toString("ascii").includes("ftyp");
  return isJpeg || isPng || isWebp || isAvif;
}

async function ensureMenuImagesBucket() {
  const { data: bucket } = await supabase.storage.getBucket("public-assets");
  if (bucket) return null;

  const { error } = await supabase.storage.createBucket("public-assets", {
    public: true,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) return error;
  return null;
}

async function uploadImage(formData: FormData, folder: string) {
  await assertAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez une image." };
  }
  if (file.size > MAX_MENU_IMAGE_SIZE) {
    return { error: "L'image doit faire 8 Mo maximum." };
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!allowedTypes.has(file.type)) {
    return { error: "Formats acceptés : JPG, PNG, WebP ou AVIF." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) {
    return { error: "Le fichier image est invalide." };
  }

  const bucketError = await ensureMenuImagesBucket();
  if (bucketError) {
    console.error("[CMS] Unable to initialize public-assets bucket:", bucketError);
    return { error: "Le stockage des images est indisponible." };
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("public-assets")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[CMS] Menu image upload failed:", uploadError);
    return { error: "Impossible d'enregistrer l'image." };
  }

  const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function uploadMenuImage(formData: FormData) {
  return uploadImage(formData, "menu");
}

export async function uploadSafiImage(formData: FormData) {
  return uploadImage(formData, "safi");
}

function safiStoragePath(url: string) {
  const configuredUrl = process.env.SUPABASE_URL;
  if (!configuredUrl) return null;

  let parsedUrl: URL;
  let configuredOrigin: string;
  try {
    parsedUrl = new URL(url);
    configuredOrigin = new URL(configuredUrl).origin;
  } catch {
    return null;
  }
  if (parsedUrl.origin !== configuredOrigin) return null;

  const marker = "/storage/v1/object/public/public-assets/";
  if (!parsedUrl.pathname.startsWith(marker)) return null;
  const path = decodeURIComponent(parsedUrl.pathname.slice(marker.length));
  return path.startsWith("safi/") ? path : null;
}

export async function deleteSafiImage(url: string) {
  await assertAdmin();
  const path = safiStoragePath(url);
  if (!path) return;

  const [settingsResult, menuItemsResult] = await Promise.all([
    supabase.from("restaurant_settings").select("value"),
    supabase.from("menu_items").select("image_url"),
  ]);
  if (settingsResult.error || menuItemsResult.error) {
    console.error("[CMS] Unable to verify Safi image references:", settingsResult.error ?? menuItemsResult.error);
    throw new Error("Impossible de vérifier les références de cette image.");
  }
  const settings = settingsResult.data;
  const menuItems = menuItemsResult.data;
  const isReferencedBySettings = (settings ?? []).some((setting) => JSON.stringify(setting.value ?? {}).includes(url));
  const isReferencedByMenu = (menuItems ?? []).some((item) => item.image_url === url);
  if (isReferencedBySettings || isReferencedByMenu) return;

  const { error } = await supabase.storage.from("public-assets").remove([path]);
  if (error) throw new Error("Impossible de supprimer cette image.");
}

export async function createMenuCategory(formData: FormData): Promise<void> {
  await assertAdmin();
  const name = text(formData, "name");
  if (!name) throw new Error("Le nom de la catégorie est obligatoire.");

  const { data: lastCategory, error: lastCategoryError } = await supabase
    .from("menu_categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastCategoryError) throw new Error(lastCategoryError.message);

  const { error } = await supabase.from("menu_categories").insert({
    name,
    display_order: (lastCategory?.display_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function updateMenuCategory(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const name = text(formData, "name");
  if (!name) throw new Error("Le nom de la catégorie est obligatoire.");

  const update: { name: string; display_order?: number } = { name };
  if (formData.has("display_order")) {
    update.display_order = number(formData, "display_order");
  }

  const { error } = await supabase.from("menu_categories").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function deleteMenuCategory(id: string): Promise<void> {
  await assertAdmin();
  const { error: itemsError } = await supabase
    .from("menu_items")
    .delete()
    .eq("category_id", id);
  if (itemsError) throw new Error(itemsError.message);

  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function reorderMenuCategories(categoryIds: string[]): Promise<void> {
  await assertAdmin();

  const ids = Array.from(new Set(categoryIds.map(String).filter(Boolean)));
  const { data: existingCategories, error: existingError } = await supabase
    .from("menu_categories")
    .select("id");
  if (existingError) throw new Error(existingError.message);

  const existingIds = new Set((existingCategories ?? []).map((category) => category.id));
  if (ids.length !== existingIds.size || ids.some((id) => !existingIds.has(id))) {
    throw new Error("La liste des catégories a changé. Actualisez la page puis réessayez.");
  }

  const updates = await Promise.all(
    ids.map((id, display_order) =>
      supabase.from("menu_categories").update({ display_order }).eq("id", id),
    ),
  );
  const failedUpdate = updates.find((result) => result.error);
  if (failedUpdate?.error) throw new Error(failedUpdate.error.message);

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function createMenuItem(formData: FormData): Promise<void> {
  await assertAdmin();
  const name = text(formData, "name");
  const categoryId = text(formData, "category_id");
  if (!name || !categoryId) throw new Error("Le nom et la catégorie sont obligatoires.");

  const priceSmall = menuPrice(formData, "price_small");
  const priceMedium = optionalMenuPrice(formData, "price_medium");
  const priceLarge = optionalMenuPrice(formData, "price_large");
  validatePriceSet(priceMedium, priceLarge);

  const { error } = await supabase.from("menu_items").insert({
    category_id: categoryId,
    name,
    description: text(formData, "description"),
    price: priceMedium ?? priceSmall,
    price_small: priceSmall,
    price_medium: priceMedium,
    price_large: priceLarge,
    is_available: formData.get("is_available") === "on",
    image_url: text(formData, "image_url") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function updateMenuItem(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const name = text(formData, "name");
  const categoryId = text(formData, "category_id");
  if (!name || !categoryId) throw new Error("Le nom et la catégorie sont obligatoires.");

  const priceSmall = menuPrice(formData, "price_small");
  const priceMedium = optionalMenuPrice(formData, "price_medium");
  const priceLarge = optionalMenuPrice(formData, "price_large");
  validatePriceSet(priceMedium, priceLarge);

  const update = {
    category_id: categoryId,
    name,
    description: text(formData, "description"),
    price: priceMedium ?? priceSmall,
    price_small: priceSmall,
    price_medium: priceMedium,
    price_large: priceLarge,
    image_url: text(formData, "image_url") || null,
  } as {
    category_id: string;
    name: string;
    description: string;
    price: number;
    price_small: number;
    price_medium: number | null;
    price_large: number | null;
    image_url: string | null;
    is_available?: boolean;
  };
  if (formData.has("is_available")) update.is_available = formData.get("is_available") === "on";
  const { error } = await supabase.from("menu_items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function deleteMenuItem(id: string): Promise<void> {
  await assertAdmin();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<void> {
  await assertAdmin();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function reorderMenuItems(formData: FormData): Promise<void> {
  await assertAdmin();
  const ids = formData.getAll("item_id").map(String);
  for (const id of ids) {
    const displayOrder = Number(formData.get(`order_${id}`));
    if (!Number.isFinite(displayOrder)) continue;
    const { error } = await supabase.from("menu_items").update({ display_order: displayOrder }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/menu");
  revalidatePath("/admin/menu");
}

export async function updateRestaurantSetting(key: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const value = text(formData, "value");
  if (!key) throw new Error("La clé du paramètre est obligatoire.");

  const { error } = await supabase.from("restaurant_settings").upsert({
    key,
    value: { value },
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/adresse");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
}

export async function updateSafiSettings(formData: FormData): Promise<void> {
  await assertAdmin();
  const imageValue = text(formData, "safi_images");
  let images: string[] = [];

  try {
    const parsed = JSON.parse(imageValue || "[]");
    if (!Array.isArray(parsed) || parsed.some((image) => typeof image !== "string")) {
      throw new Error("invalid images");
    }
    images = parsed.filter(Boolean).slice(0, 30);
  } catch {
    throw new Error("La galerie Safi contient des images invalides.");
  }

  const values = [
    ["safi_title", text(formData, "safi_title")],
    ["safi_description", text(formData, "safi_description")],
    ["safi_button_text", text(formData, "safi_button_text")],
    ["safi_button_link", text(formData, "safi_button_link")],
    ["safi_images", images],
  ].map(([key, value]) => ({
    key,
    value: { value },
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("restaurant_settings").upsert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/safi");
  revalidatePath("/admin/settings");
}

function jsonSetting(formData: FormData, key: string) {
  try {
    return JSON.parse(text(formData, key) || "[]") as unknown;
  } catch {
    throw new Error(`Le champ ${key} contient des données invalides.`);
  }
}

function isText(value: unknown, maxLength: number, required = true) {
  return typeof value === "string" && value.length <= maxLength && (!required || value.trim().length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function jsonArraySetting(formData: FormData, key: string, isValid: (value: unknown) => boolean, maxItems: number) {
  const value = jsonSetting(formData, key);
  if (!Array.isArray(value) || value.length > maxItems || !value.every(isValid)) {
    throw new Error(`Le champ ${key} contient des données invalides.`);
  }
  return value;
}

export async function updateSafiPageContent(formData: FormData): Promise<void> {
  await assertAdmin();

  const timeline = jsonArraySetting(
    formData,
    "safi_history_timeline",
    (item) => isRecord(item) && isText(item.year, 80) && isText(item.title, 200) && isText(item.description, 1200, false),
    30,
  );
  const patrimoineFacts = jsonArraySetting(
    formData,
    "safi_patrimoine_facts",
    (item) => isRecord(item) && isText(item.label, 120) && isText(item.description, 600, false),
    20,
  );
  const savoirFacts = jsonArraySetting(
    formData,
    "safi_savoir_facts",
    (item) => isRecord(item) && isText(item.label, 120) && isText(item.description, 600, false),
    20,
  );
  const galleryImages = jsonArraySetting(
    formData,
    "safi_gallery_images",
    (item) => isRecord(item) && isText(item.url, 2048) && isText(item.alt, 300, false) && isText(item.caption, 300, false),
    30,
  );
  const valueFields: Array<[string, number]> = [
    ["safi_hero_eyebrow", 120],
    ["safi_hero_title", 200],
    ["safi_hero_description", 1600],
    ["safi_hero_image", 2048],
    ["safi_hero_image_alt", 300],
    ["safi_history_eyebrow", 120],
    ["safi_history_title", 200],
    ["safi_history_description", 1600],
    ["safi_patrimoine_eyebrow", 120],
    ["safi_patrimoine_title", 200],
    ["safi_patrimoine_description", 1600],
    ["safi_savoir_eyebrow", 120],
    ["safi_savoir_title", 200],
    ["safi_savoir_description", 1600],
    ["safi_gallery_eyebrow", 120],
    ["safi_gallery_title", 200],
    ["safi_gallery_description", 1600],
  ];
  const values = valueFields.map(([key, maxLength]) => ({
    key,
    value: { value: safiText(formData, key, maxLength) },
    updated_at: new Date().toISOString(),
  }));

  const jsonValues = [
    ["safi_history_timeline", timeline],
    ["safi_patrimoine_facts", patrimoineFacts],
    ["safi_savoir_facts", savoirFacts],
    ["safi_gallery_images", galleryImages],
  ].map(([key, value]) => ({
    key: String(key),
    value: { value },
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("restaurant_settings").upsert([...values, ...jsonValues]);
  if (error) throw new Error(error.message);

  revalidatePath("/safi");
  revalidateTag("safi-page-content", "max");
  revalidatePath("/");
  revalidatePath("/admin/safi");
}
