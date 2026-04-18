import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, ImageIcon, Wand2, Download, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/storage";
import logoSrc from "@/assets/fixi-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fixi AI — Remove Image Backgrounds Instantly with AI" },
      {
        name: "description",
        content:
          "Pixel-perfect AI background removal in under 5 seconds. Free to start. JPG, PNG, WEBP up to 10 MB.",
      },
      { property: "og:title", content: "Fixi AI — Remove Backgrounds Instantly" },
      {
        property: "og:description",
        content: "AI background remover. One click. Pixel-perfect cutouts.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-radial blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <img
                src={logoSrc}
                alt=""
                aria-hidden="true"
                className="h-24 w-24 animate-float drop-shadow-[0_0_40px_rgba(14,165,255,0.5)]"
              />
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Gemini Vision AI
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Remove backgrounds.
              <br />
              <span className="text-gradient">In a snap.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              AI-powered background removal that actually works. Drop an image, get a pixel-perfect
              cutout in seconds. No skill required.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <HeroUpload />
              <Button asChild variant="glow" size="lg">
                <Link to="/pricing">See pricing</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                No signup required • Try 1 image free
              </p>
            </div>
          </div>

          {/* Visual demo card */}
          <div className="mx-auto mt-20 max-w-4xl">
            <div className="glass relative rounded-2xl p-2 shadow-card-glow">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-accent/20" />
                  <div className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur">
                    Original
                  </div>
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-20 w-20 text-muted-foreground/40" />
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl checkerboard">
                  <div className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur">
                    Cutout
                  </div>
                  <div className="flex h-full w-full items-center justify-center">
                    <Wand2 className="h-20 w-20 text-primary drop-shadow-[0_0_20px_rgba(14,165,255,0.6)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Built for <span className="text-gradient">speed.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to ship cleaner visuals, faster.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Under 5 seconds"
              desc="Upload, process, download. The whole flow in less time than your coffee order."
            />
            <FeatureCard
              icon={<Wand2 className="h-6 w-6" />}
              title="AI precision"
              desc="Edges that handle hair, fur, glass, and translucent details — not just hard outlines."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Auto-deleted in 24h"
              desc="Your images aren't training data. We delete originals and results after 24 hours."
            />
            <FeatureCard
              icon={<ImageIcon className="h-6 w-6" />}
              title="Up to 10 MB"
              desc="JPG, PNG, WEBP. Up to 5000×5000 resolution. Transparent PNG output every time."
            />
            <FeatureCard
              icon={<Download className="h-6 w-6" />}
              title="Instant download"
              desc="Direct download or copy URL. Use in Figma, Photoshop, your CMS — wherever."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="API access"
              desc="Drop Fixi into your workflow. REST API with simple per-call billing. (Coming soon)"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="glass relative overflow-hidden rounded-3xl p-12 text-center shadow-card-glow">
            <div className="absolute inset-0 -z-10 bg-gradient-brand-soft" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Stop tracing. Start <span className="text-gradient">snapping</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Free for 5 images per day. Pro is unlimited.
            </p>
            <div className="mt-8">
              <Button asChild variant="hero" size="xl">
                <Link to="/register">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function HeroUpload() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          sessionStorage.setItem(
            "fixi:pending-upload",
            JSON.stringify({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: reader.result,
            }),
          );
        } catch {
          toast.error("Image too large to stage in browser. Try a smaller file.");
          return;
        }
        navigate({ to: "/app" });
      };
      reader.onerror = () => toast.error("Could not read file");
      reader.readAsDataURL(file);
    },
    [navigate],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`glass group relative w-full max-w-xl cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center shadow-card-glow transition-all ${
        isDragging
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-primary/40 hover:border-primary hover:shadow-glow-sm"
      }`}
      aria-label="Upload an image to remove its background"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary ring-1 ring-primary/30 transition-transform group-hover:scale-110">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            Drop an image to remove its background
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or <span className="text-primary underline-offset-4 group-hover:underline">click to browse</span> · JPG, PNG, WEBP · up to 10 MB
          </p>
        </div>
      </div>
    </div>
  );
}
