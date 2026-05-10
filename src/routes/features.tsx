import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Wand2, Zap, Shield, Globe, Layers, Lock } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Fixi AI" },
      {
        name: "description",
        content:
          "AI background removal with edge-perfect cutouts, 24h auto-delete, 10 MB uploads, and a clean API.",
      },
      { property: "og:title", content: "Fixi AI Features" },
      {
        property: "og:description",
        content: "Everything Fixi AI can do for your images and your workflow.",
      },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  {
    icon: <Wand2 className="h-6 w-6" />,
    title: "Edge-perfect AI cutouts",
    desc: "Hair, fur, glass, motion blur — handled. Powered by Google Gemini's vision model.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Sub-5 second processing",
    desc: "Most images process in 2–4 seconds. No queue, no spinner-of-death.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Auto-delete in 24 hours",
    desc: "Originals and results are wiped from storage after 24 hours. Privacy-first by default.",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Transparent PNG output",
    desc: "Always returns a 32-bit PNG with full alpha channel. Drop into any design tool.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Public REST API",
    desc: "Simple HTTP endpoint with API keys, rate limiting, and usage analytics. (B2B coming soon)",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Secure by default",
    desc: "Row-level security on every record. JWT-authenticated requests. HTTPS everywhere.",
  },
];

function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Everything you need to <span className="text-gradient">cut clean</span>.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A focused tool that does one thing exceptionally well.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary ring-1 ring-primary/20">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
