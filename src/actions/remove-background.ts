import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const IMAGE_BUCKET = "snapcut-images";
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const removeBackgroundSchema = z
  .object({
    uploadId: z.string().uuid().optional(),
    imageBase64: z.string().optional(),
    userId: z.string().uuid().optional(),
    accessToken: z.string().min(20).optional(),
    originalFilename: z.string().optional(),
    fileSizeBytes: z.number().optional(),
    processingStartedAt: z.number().optional(),
  })
  .refine((data) => data.uploadId || data.imageBase64, {
    message: "Upload id or image data is required.",
  });

async function ensureImageBucket() {
  const { data: bucket, error: getError } = await supabaseAdmin.storage.getBucket(IMAGE_BUCKET);
  if (bucket) return;

  const notFound =
    getError?.message?.toLowerCase().includes("not found") ||
    getError?.message?.toLowerCase().includes("does not exist");
  if (getError && !notFound) throw new Error(`Could not check storage bucket: ${getError.message}`);

  const { error: createError } = await supabaseAdmin.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Could not create storage bucket: ${createError.message}`);
  }
}

async function getOrCreateProfile(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("credits_remaining, plan, credits_reset_at")
    .eq("id", userId)
    .maybeSingle();

  if (profile) return profile;
  if (error) throw new Error(`Could not load profile: ${error.message}`);

  const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !authUser.user) {
    throw new Error("User account not found");
  }

  const metadata = authUser.user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" ? metadata.display_name : undefined;

  const { data: createdProfile, error: createError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: userId,
      email: authUser.user.email,
      display_name: displayName,
      credits_remaining: 2,
      credits_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      plan: "free",
    })
    .select("credits_remaining, plan, credits_reset_at")
    .single();

  if (createError || !createdProfile) {
    throw new Error(`Could not create profile: ${createError?.message ?? "Unknown error"}`);
  }

  return createdProfile;
}

async function requireMatchingUser(userId: string | undefined, accessToken: string | undefined) {
  if (!userId || !accessToken) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Invalid or expired session. Please sign in again.");
  }

  if (data.user.id !== userId) {
    throw new Error("You are not authorized to process this upload.");
  }

  return data.user;
}

/**
 * Remove background from an image.
 * Current implementation: Sends binary image to n8n webhook and handles JSON response with image URL.
 */
export const removeBackground = createServerFn({ method: "POST" })
  .inputValidator(removeBackgroundSchema)
  .handler(
  async ({ data }: { data?: any }) => {
    const input = data || {};
    let { uploadId } = input;
    const {
      imageBase64,
      userId,
      accessToken,
      originalFilename,
      fileSizeBytes,
      processingStartedAt,
    } = input;

    let originalDataUrl = imageBase64;

    if (!uploadId && imageBase64 && userId) {
      await requireMatchingUser(userId, accessToken);
      await ensureImageBucket();

      const [header, base64Data] = imageBase64.includes(",")
        ? imageBase64.split(",")
        : ["data:image/png;base64", imageBase64];
      const mime = header.match(/:(.*?);/)?.[1] || "image/png";
      if (!ACCEPTED_IMAGE_TYPES.has(mime)) {
        throw new Error("Only JPG, PNG, or WEBP images are supported");
      }

      const extension = mime.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const objectId = crypto.randomUUID();
      const originalPath = `${userId}/originals/${objectId}.${extension}`;
      const originalBuffer = Buffer.from(base64Data, "base64");
      if (originalBuffer.byteLength > MAX_IMAGE_BYTES) {
        throw new Error("File too large. Max size is 10 MB");
      }

      const { error: originalUploadError } = await supabaseAdmin.storage
        .from(IMAGE_BUCKET)
        .upload(originalPath, originalBuffer, { contentType: mime, upsert: false });
      if (originalUploadError) {
        throw new Error(`Failed to upload original: ${originalUploadError.message}`);
      }

      const { data: row, error: insertError } = await supabaseAdmin
        .from("uploads")
        .insert({
          user_id: userId,
          original_path: originalPath,
          original_filename: originalFilename,
          file_size_bytes: fileSizeBytes ?? originalBuffer.byteLength,
          status: "pending",
        })
        .select("id")
        .single();
      if (insertError || !row) throw insertError ?? new Error("Failed to create upload record");

      uploadId = row.id;
    }

    if (uploadId) {
      await requireMatchingUser(userId, accessToken);

      const { data: upload, error: upErr } = await supabaseAdmin
        .from("uploads")
        .select("*")
        .eq("id", uploadId)
        .eq("user_id", userId)
        .single();

      if (upErr || !upload) throw new Error("Upload not found");
      if (upload.status === "done" && upload.result_path) {
        return { uploadId, resultPath: upload.result_path, status: "done" as const };
      }

      const profile = await getOrCreateProfile(userId);

      let credits = profile.credits_remaining;
      if (profile.plan === "free" && new Date(profile.credits_reset_at) < new Date()) {
        credits = 2;
        await supabaseAdmin
          .from("profiles")
          .update({
            credits_remaining: 2,
            credits_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", userId);
      }

      if (credits <= 0) {
        throw new Error("No credits remaining. Upgrade your plan for more credits.");
      }

      // Mark processing
      await ensureImageBucket();
      await supabaseAdmin
        .from("uploads")
        .update({ status: "processing", error_message: null })
        .eq("id", uploadId);

      // Download original
      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from(IMAGE_BUCKET)
        .download(upload.original_path);
      if (dlErr || !blob) throw new Error("Failed to download original");

      const arrayBuf = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      const mime = blob.type || "image/png";
      originalDataUrl = `data:${mime};base64,${base64}`;
    }

    if (!originalDataUrl) throw new Error("No image data available");

    const N8N_WEBHOOK_URL =
      process.env.N8N_WEBHOOK_URL?.trim() ||
      "https://shreyagupta1010.app.n8n.cloud/webhook/remove-background";

    try {
      let resultBase64 = originalDataUrl;
      let resultBuffer: Buffer | null = null;

      if (N8N_WEBHOOK_URL) {
        // Sending to n8n in binary format (multipart/form-data)
        const formData = new FormData();

        // Extract mime and buffer from data URL
        const [header, base64Data] = originalDataUrl.includes(",")
          ? originalDataUrl.split(",")
          : ["data:image/png;base64", originalDataUrl];
        const mime = header.match(/:(.*?);/)?.[1] || "image/png";
        const buffer = Buffer.from(base64Data, "base64");

        // Create a File object for multipart upload
        const file = new File([buffer], "image.png", { type: mime });
        formData.append("image", file);

        // In n8n, production webhooks use /webhook/... while editor test runs use /webhook-test/...
        // If production endpoint is unavailable (404), retry the test endpoint automatically.
        const webhookCandidates = [N8N_WEBHOOK_URL];
        if (N8N_WEBHOOK_URL.includes("/webhook/")) {
          webhookCandidates.push(N8N_WEBHOOK_URL.replace("/webhook/", "/webhook-test/"));
        }

        let apiResp: Response | null = null;
        let lastErrorText = "";
        for (const webhookUrl of webhookCandidates) {
          const resp = await fetch(webhookUrl, {
            method: "POST",
            body: formData,
          });
          if (resp.ok) {
            apiResp = resp;
            break;
          }
          lastErrorText = await resp.text();
          if (resp.status !== 404) {
            throw new Error(`n8n Webhook Error: ${resp.status} - ${lastErrorText.slice(0, 120)}`);
          }
        }

        if (!apiResp) {
          throw new Error(
            `n8n webhook not responding. Check your webhook URL and n8n status. Last error: ${lastErrorText.slice(0, 100)}`,
          );
        }

        const responseData = await apiResp.json();

        const maybeImageUrl =
          responseData?.image_url ||
          responseData?.url ||
          responseData?.body?.image_url ||
          responseData?.body?.url ||
          responseData?.data?.image_url ||
          responseData?.data?.url ||
          responseData?.[0]?.image_url ||
          responseData?.[0]?.url ||
          responseData?.[0]?.json?.image_url ||
          responseData?.[0]?.json?.url ||
          responseData?.[0]?.body?.image_url ||
          responseData?.[0]?.body?.url ||
          responseData?.body?.data?.image_url ||
          responseData?.body?.data?.url ||
          responseData?.[0]?.body?.data?.image_url ||
          responseData?.[0]?.body?.data?.url;

        const maybeBinary =
          responseData?.binary?.image ||
          responseData?.[0]?.binary?.image ||
          responseData?.[0]?.binary?.data;

        if (maybeBinary?.data) {
          const mimeType = maybeBinary.mimeType || maybeBinary.mime || "image/png";
          resultBuffer = Buffer.from(maybeBinary.data, "base64");
          resultBase64 = `data:${mimeType};base64,${resultBuffer.toString("base64")}`;
        } else if (maybeImageUrl) {
          const imgResp = await fetch(maybeImageUrl);
          if (!imgResp.ok) throw new Error("Failed to fetch processed image from n8n");

          resultBuffer = Buffer.from(await imgResp.arrayBuffer());
          resultBase64 = `data:image/png;base64,${resultBuffer.toString("base64")}`;
        } else {
          throw new Error(
            `n8n webhook returned unexpected payload. Expected image_url or binary image data. Response: ${JSON.stringify(
              Array.isArray(responseData) ? responseData.slice(0, 2) : responseData,
            ).slice(0, 300)}`,
          );
        }
      }

      if (uploadId && userId) {
        // Store result in Supabase
        const resultFileName = `result_${Date.now()}.png`;
        await ensureImageBucket();
        const { error: uploadErr } = await supabaseAdmin.storage
          .from(IMAGE_BUCKET)
          .upload(`${userId}/${resultFileName}`, resultBuffer || Buffer.from(resultBase64));

        if (uploadErr) throw new Error(`Failed to upload result: ${uploadErr.message}`);

        // Update upload record
        const completedAt = new Date();
        const processingTimeMs =
          typeof processingStartedAt === "number"
            ? Math.max(0, completedAt.getTime() - processingStartedAt)
            : null;

        await supabaseAdmin
          .from("uploads")
          .update({
            status: "done",
            result_path: `${userId}/${resultFileName}`,
            completed_at: completedAt.toISOString(),
            processing_time_ms: processingTimeMs,
            error_message: null,
          })
          .eq("id", uploadId);

        // Deduct credits if not pro
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("plan, credits_remaining")
          .eq("id", userId)
          .single();

        if (profile && profile.credits_remaining > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({ credits_remaining: profile.credits_remaining - 1 })
            .eq("id", userId);
        }

        return { uploadId, resultPath: `${userId}/${resultFileName}`, status: "done" as const };
      }

      return { resultDataUrl: resultBase64, status: "success" as const };
    } catch (error) {
      if (uploadId) {
        await supabaseAdmin
          .from("uploads")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", uploadId);
      }

      throw error;
    }
  });
