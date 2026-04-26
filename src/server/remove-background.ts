import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Input = { uploadId?: string; imageBase64?: string };
type Context = { userId?: string };

/**
 * Remove background from an image.
 * Current implementation: Sends binary image to n8n webhook and handles JSON response with image URL.
 */
export const removeBackground = createServerFn({ method: "POST" }).handler(
  async ({ data, context }) => {
    const userId = (context as Context | undefined)?.userId;
    const { uploadId, imageBase64 } = data as Input;

    let originalDataUrl = imageBase64;

    if (uploadId) {
      if (!userId) throw new Error("Authentication required for uploadId processing");

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
      // Check credits
      const { data: profile, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("credits_remaining, plan, credits_reset_at")
        .eq("id", userId)
        .single();
      if (pErr || !profile) throw new Error("Profile not found");

      let credits = profile.credits_remaining;
      if (profile.plan === "free" && new Date(profile.credits_reset_at) < new Date()) {
        credits = 5;
        await supabaseAdmin
          .from("profiles")
          .update({
            credits_remaining: 5,
            credits_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", userId);
      }

      if (profile.plan !== "pro" && credits <= 0) {
        throw new Error("No credits remaining. Upgrade to Pro for unlimited.");
      }

      // Mark processing
      await supabaseAdmin
        .from("uploads")
        .update({ status: "processing", error_message: null })
        .eq("id", uploadId);

      // Download original
      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from("snapcut-images")
        .download(upload.original_path);
      if (dlErr || !blob) throw new Error("Failed to download original");

      const arrayBuf = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      const mime = blob.type || "image/png";
      originalDataUrl = `data:${mime};base64,${base64}`;
    }

    if (!originalDataUrl) throw new Error("No image data available");

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL?.trim();

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

        const apiResp = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          body: formData,
        });

        if (!apiResp.ok) {
          const errorText = await apiResp.text();
          throw new Error(`n8n Webhook Error: ${apiResp.status} - ${errorText.slice(0, 100)}`);
        }

        // Process JSON response to get the URL
        const jsonResponse = await apiResp.json();
        const imageUrl = jsonResponse.url;

        if (!imageUrl) {
          throw new Error(
            "n8n Webhook returned success but no image URL was found in the response.",
          );
        }

        // Fetch the image from the Cloudinary URL
        const imageFetchResp = await fetch(imageUrl);
        if (!imageFetchResp.ok) {
          throw new Error(
            `Failed to fetch processed image from Cloudinary: ${imageFetchResp.statusText}`,
          );
        }

        const resultBlob = await imageFetchResp.blob();
        const arrayBuffer = await resultBlob.arrayBuffer();
        resultBuffer = Buffer.from(arrayBuffer);
        resultBase64 = `data:image/png;base64,${resultBuffer.toString("base64")}`;
      } else {
        // Fallback: simulate processing and return original
        await new Promise((resolve) => setTimeout(resolve, 1500));
        resultBase64 = originalDataUrl;
        const [header, base64Data] = resultBase64.includes(",")
          ? resultBase64.split(",")
          : ["data:image/png;base64", resultBase64];
        resultBuffer = Buffer.from(base64Data, "base64");
      }

      if (uploadId && userId && resultBuffer) {
        // Upload result to Supabase
        const resultPath = `${userId}/results/${uploadId}.png`;
        const { error: upErr2 } = await supabaseAdmin.storage
          .from("snapcut-images")
          .upload(resultPath, resultBuffer, {
            contentType: "image/png",
            upsert: true,
          });
        if (upErr2) throw upErr2;

        // Update upload row
        await supabaseAdmin
          .from("uploads")
          .update({ status: "done", result_path: resultPath })
          .eq("id", uploadId);

        // Deduct credit
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("credits_remaining, plan")
          .eq("id", userId)
          .single();
        if (profile && profile.plan !== "pro") {
          await supabaseAdmin
            .from("profiles")
            .update({ credits_remaining: (profile.credits_remaining || 1) - 1 })
            .eq("id", userId);
        }

        return { uploadId, resultPath, status: "done" as const };
      }

      // Guest flow: return base64
      return { resultDataUrl: resultBase64, status: "done" as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (uploadId) {
        await supabaseAdmin
          .from("uploads")
          .update({ status: "failed", error_message: msg })
          .eq("id", uploadId);
      }
      throw err;
    }
  },
);
