import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Input = { uploadId: string };

/**
 * Remove background from an image using Lovable AI Gateway (Gemini image edit).
 * Flow:
 *  1. Authenticated user calls with uploadId
 *  2. We verify the upload belongs to them and they have credits
 *  3. Download original from storage, send to Gemini for transparent cutout
 *  4. Upload PNG result, update row, deduct credit
 */
export const removeBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input): Input => {
    if (!input?.uploadId || typeof input.uploadId !== "string") {
      throw new Error("uploadId is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { uploadId } = data;

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 1. Load upload + verify ownership (using admin client to bypass RLS for atomic ops)
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

    // 2. Check credits
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("credits_remaining, plan, credits_reset_at")
      .eq("id", userId)
      .single();
    if (pErr || !profile) throw new Error("Profile not found");

    // Auto-reset daily credits for free plan
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
      await supabaseAdmin
        .from("credit_events")
        .insert({ user_id: userId, delta: 5, reason: "daily_reset" });
    }

    if (profile.plan !== "pro" && credits <= 0) {
      throw new Error("No credits remaining. Upgrade to Pro for unlimited.");
    }

    // 3. Mark processing
    await supabaseAdmin
      .from("uploads")
      .update({ status: "processing", error_message: null })
      .eq("id", uploadId);

    try {
      // Download original
      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from("snapcut-images")
        .download(upload.original_path);
      if (dlErr || !blob) throw new Error("Failed to download original");

      // Convert to base64 data URL for Gemini
      const arrayBuf = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      const mime = blob.type || "image/png";
      const dataUrl = `data:${mime};base64,${base64}`;

      // Call Lovable AI Gateway (Gemini image edit)
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Remove the background completely. Keep only the main subject with clean, precise edges. Output as a PNG with a fully transparent background. Preserve fine details like hair, fur, and translucent elements.",
                },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (aiResp.status === 429) throw new Error("Rate limit exceeded. Try again in a moment.");
      if (aiResp.status === 402) throw new Error("AI credits exhausted. Contact support.");
      if (!aiResp.ok) {
        const txt = await aiResp.text();
        throw new Error(`AI gateway error ${aiResp.status}: ${txt.slice(0, 200)}`);
      }

      const aiJson = await aiResp.json();
      const resultDataUrl: string | undefined =
        aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!resultDataUrl?.startsWith("data:image/")) {
        throw new Error("AI did not return an image");
      }

      // Decode result
      const [, b64] = resultDataUrl.split(",");
      const resultBytes = Buffer.from(b64, "base64");

      // Upload result
      const resultPath = `${userId}/results/${uploadId}.png`;
      const { error: upErr2 } = await supabaseAdmin.storage
        .from("snapcut-images")
        .upload(resultPath, resultBytes, {
          contentType: "image/png",
          upsert: true,
        });
      if (upErr2) throw new Error(`Upload failed: ${upErr2.message}`);

      // Update upload row
      await supabaseAdmin
        .from("uploads")
        .update({ status: "done", result_path: resultPath })
        .eq("id", uploadId);

      // Deduct credit (skip for pro plan)
      if (profile.plan !== "pro") {
        await supabaseAdmin
          .from("profiles")
          .update({ credits_remaining: credits - 1 })
          .eq("id", userId);
        await supabaseAdmin
          .from("credit_events")
          .insert({ user_id: userId, delta: -1, reason: "image_processed", upload_id: uploadId });
      }

      return { uploadId, resultPath, status: "done" as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed", error_message: msg })
        .eq("id", uploadId);
      throw err;
    }
  });
