import { supabase } from "@/integrations/supabase/client";

export function getPublicImageUrl(path: string): string {
  const { data } = supabase.storage.from("snapcut-images").getPublicUrl(path);
  return data.publicUrl;
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WEBP images are supported";
  }
  if (file.size > MAX_BYTES) {
    return "File too large. Max size is 10 MB";
  }
  return null;
}
