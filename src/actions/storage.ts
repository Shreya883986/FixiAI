import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const IMAGE_BUCKET = "snapcut-images";

export const ensureImageBucket = createServerFn({ method: "POST" }).handler(async () => {
  const { data: bucket, error: getError } = await supabaseAdmin.storage.getBucket(IMAGE_BUCKET);

  if (bucket) return { bucket: IMAGE_BUCKET, created: false as const };

  const notFound =
    getError?.message?.toLowerCase().includes("not found") ||
    getError?.message?.toLowerCase().includes("does not exist");

  if (getError && !notFound) {
    throw new Error(`Could not check storage bucket: ${getError.message}`);
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Could not create storage bucket: ${createError.message}`);
  }

  return { bucket: IMAGE_BUCKET, created: true as const };
});
