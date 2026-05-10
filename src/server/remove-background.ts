import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Remove background from an image.
 * Current implementation: Sends binary image to n8n webhook and handles JSON response with image URL.
 */
export const removeBackground = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data?: any }) => {
    const input = data || {};
    const { uploadId, imageBase64 } = input;
    let userId: string | undefined = undefined;

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
        const { error: uploadErr } = await supabaseAdmin.storage
          .from("snapcut-images")
          .upload(`${userId}/${resultFileName}`, resultBuffer || Buffer.from(resultBase64));

        if (uploadErr) throw new Error(`Failed to upload result: ${uploadErr.message}`);

        // Update upload record
        await supabaseAdmin
          .from("uploads")
          .update({
            status: "done",
            result_path: `${userId}/${resultFileName}`,
            error_message: null,
          })
          .eq("id", uploadId);

        // Deduct credits if not pro
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("plan, credits_remaining")
          .eq("id", userId)
          .single();

        if (profile && profile.plan !== "pro" && profile.credits_remaining > 0) {
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
