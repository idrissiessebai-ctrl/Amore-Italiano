import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "public-assets";
const PUBLIC_ROOT = resolve(process.cwd(), "public");
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

async function imageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await imageFiles(path)));
    else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(path);
  }

  return files;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !error.message.toLowerCase().includes("already exists")) throw error;
  }

  const files = await imageFiles(PUBLIC_ROOT);
  const assets: Record<string, string> = {};
  for (const file of files) {
    const storagePath = relative(PUBLIC_ROOT, file).split(sep).join("/");
    const { data: existing } = await supabase.storage.from(BUCKET).download(storagePath);

    if (!existing) {
      const contents = await readFile(file);
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, contents, {
        contentType: contentTypes[extname(file).toLowerCase()] ?? "application/octet-stream",
        upsert: false,
      });
      if (error) throw new Error(`Unable to upload ${storagePath}: ${error.message}`);
      console.log(`Uploaded ${storagePath}`);
    } else {
      console.log(`Skipped ${storagePath} (already exists)`);
    }

    assets[`/${storagePath}`] = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  await writeFile(
    resolve(process.cwd(), "scripts/public-assets-manifest.json"),
    `${JSON.stringify(assets, null, 2)}\n`,
    "utf8",
  );
  console.log(`Migrated ${files.length} image asset(s) to ${BUCKET}.`);
  console.log(JSON.stringify(assets, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
