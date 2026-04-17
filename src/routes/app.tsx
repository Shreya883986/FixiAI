import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "@/lib/storage";
import { removeBackground } from "@/server/remove-background";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Loader2,
  Download,
  Trash2,
  ImageIcon,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — SnapCut AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppPage,
});

type Upload = {
  id: string;
  user_id: string;
  original_path: string;
  result_path: string | null;
  original_filename: string | null;
  status: "pending" | "processing" | "done" | "failed";
  error_message: string | null;
  created_at: string;
  expires_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: string;
  credits_remaining: number;
  credits_reset_at: string;
};

function AppPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Workspace userId={user.id} />;
}

function Workspace({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const { data: uploads = [] } = useQuery({
    queryKey: ["uploads", userId],
    queryFn: async (): Promise<Upload[]> => {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Upload[];
    },
    refetchInterval: (q) => {
      const list = q.state.data as Upload[] | undefined;
      return list?.some((u) => u.status === "pending" || u.status === "processing") ? 1500 : false;
    },
  });

  const refreshAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["uploads", userId] });
    qc.invalidateQueries({ queryKey: ["profile", userId] });
  }, [qc, userId]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Plan"
              value={profile?.plan === "pro" ? "Pro" : "Free"}
              hint={profile?.plan === "pro" ? "Unlimited" : "Upgrade for unlimited"}
              accent
            />
            <StatCard
              label="Credits"
              value={
                profile?.plan === "pro"
                  ? "∞"
                  : profile?.credits_remaining?.toString() ?? "—"
              }
              hint={profile?.plan === "pro" ? "No daily limit" : "Resets every 24h"}
            />
            <StatCard
              label="This week"
              value={uploads
                .filter((u) => new Date(u.created_at) > new Date(Date.now() - 7 * 86400000))
                .length.toString()}
              hint="Images processed"
            />
          </div>

          {/* Upload zone */}
          <UploadZone userId={userId} onUploaded={refreshAll} profile={profile} />

          {/* History */}
          <div className="mt-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent cutouts</h2>
              {uploads.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Auto-deleted after 24 hours
                </p>
              )}
            </div>

            {uploads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-16 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No images yet. Upload one above to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {uploads.map((u) => (
                  <UploadCard key={u.id} upload={u} onChanged={refreshAll} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-sm ${
        accent ? "border-primary/30 bg-gradient-brand-soft" : "border-border/60 bg-card/40"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function UploadZone({
  userId,
  onUploaded,
  profile,
}: {
  userId: string;
  onUploaded: () => void;
  profile: Profile | null | undefined;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const noCredits = profile && profile.plan !== "pro" && profile.credits_remaining <= 0;

  async function handleFile(file: File) {
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    if (noCredits) {
      toast.error("You're out of credits today. Upgrade to Pro for unlimited.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload original to storage (per-user folder)
      const ext = file.name.split(".").pop() || "png";
      const objectId = crypto.randomUUID();
      const originalPath = `${userId}/originals/${objectId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("snapcut-images")
        .upload(originalPath, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // 2. Create upload row
      const { data: row, error: insErr } = await supabase
        .from("uploads")
        .insert({
          user_id: userId,
          original_path: originalPath,
          original_filename: file.name,
          file_size_bytes: file.size,
          status: "pending",
        })
        .select("id")
        .single();
      if (insErr || !row) throw insErr ?? new Error("Failed to create record");

      onUploaded();
      toast.success("Processing your image…");

      // 3. Trigger background removal (server function)
      try {
        await removeBackground({ data: { uploadId: row.id } });
        toast.success("Done! Background removed.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Processing failed";
        toast.error(msg);
      }
      onUploaded();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
        dragActive
          ? "border-primary bg-primary/5 shadow-glow"
          : "border-border/60 bg-card/30 hover:border-primary/40"
      } ${noCredits ? "opacity-60" : ""}`}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-30" />

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow-sm">
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" />
        ) : (
          <Upload className="h-7 w-7 text-primary-foreground" />
        )}
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        {uploading ? "Uploading…" : "Drop an image to remove its background"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        JPG, PNG, or WEBP · up to 10 MB · processed in seconds
      </p>

      <div className="mt-6">
        <Button
          variant="hero"
          size="lg"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !!noCredits}
        >
          <Sparkles className="h-4 w-4" />
          Choose image
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {noCredits && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-200">
          <AlertCircle className="h-3.5 w-3.5" />
          Out of credits — <Link to="/pricing" className="underline">upgrade to Pro</Link>
        </div>
      )}
    </div>
  );
}

function UploadCard({ upload, onChanged }: { upload: Upload; onChanged: () => void }) {
  const originalUrl = useMemo(
    () => supabase.storage.from("snapcut-images").getPublicUrl(upload.original_path).data.publicUrl,
    [upload.original_path]
  );
  const resultUrl = useMemo(
    () =>
      upload.result_path
        ? supabase.storage.from("snapcut-images").getPublicUrl(upload.result_path).data.publicUrl
        : null,
    [upload.result_path]
  );

  async function handleDelete() {
    const paths = [upload.original_path];
    if (upload.result_path) paths.push(upload.result_path);
    await supabase.storage.from("snapcut-images").remove(paths);
    await supabase.from("uploads").delete().eq("id", upload.id);
    onChanged();
    toast.success("Deleted");
  }

  async function handleDownload() {
    if (!resultUrl) return;
    const resp = await fetch(resultUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapcut-${upload.id.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const processing = upload.status === "pending" || upload.status === "processing";

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="relative aspect-square">
        {upload.status === "done" && resultUrl ? (
          <div className="checkerboard h-full w-full">
            <img
              src={resultUrl}
              alt="Result"
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : upload.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-destructive/5 p-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-xs text-destructive line-clamp-3">
              {upload.error_message ?? "Failed"}
            </p>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <img
              src={originalUrl}
              alt="Original"
              className="h-full w-full object-cover opacity-50"
              loading="lazy"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="mt-2 text-xs font-medium">Processing…</p>
              <Progress value={50} className="mt-3 h-1 w-32" />
            </div>
          </div>
        )}

        <div className="absolute right-2 top-2">
          <Badge
            variant="secondary"
            className={
              upload.status === "done"
                ? "border-primary/30 bg-primary/20 text-primary"
                : upload.status === "failed"
                  ? "border-destructive/30 bg-destructive/20 text-destructive"
                  : ""
            }
          >
            {upload.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between p-3">
        <p className="truncate text-xs text-muted-foreground">
          {upload.original_filename ?? "image"}
        </p>
        <div className="flex gap-1">
          {upload.status === "done" && (
            <Button size="icon" variant="ghost" onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
          {!processing && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              title="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
