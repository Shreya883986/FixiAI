import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Fixi AI" },
      {
        name: "description",
        content:
          "Fixi AI is a focused AI background-removal tool built for creators, sellers, and developers.",
      },
      { property: "og:title", content: "About Fixi AI" },
      { property: "og:description", content: "Why we built Fixi AI." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Info className="h-3.5 w-3.5" />
            About Fixi AI
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Built to make <span className="text-gradient">cutouts</span> effortless
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Fixi AI removes backgrounds fast and returns clean transparent PNGs without the bloat.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="glow">
              <Link to="/">Try it now</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl space-y-4">
          <div className="glass rounded-3xl p-8 shadow-card-glow">
            <h2 className="text-xl font-semibold">Why we built Fixi</h2>
            <p className="mt-3 text-muted-foreground">
              We started Fixi AI because most background removers felt like they were built for
              someone else: bloated editors, watermarks, and uploads that took longer than the
              actual cutout.
            </p>
          </div>

          <div className="glass rounded-3xl p-8 shadow-card-glow">
            <h2 className="text-xl font-semibold">What Fixi does</h2>
            <p className="mt-3 text-muted-foreground">
              Fixi does one thing: remove backgrounds with AI, fast, and give you a clean transparent
              PNG. No editor, no upsell wall, no friction between upload and download.
            </p>
          </div>

          <div className="glass rounded-3xl p-8 shadow-card-glow">
            <h2 className="text-xl font-semibold">Privacy-first</h2>
            <p className="mt-3 text-muted-foreground">
              Your images are auto-deleted after 24 hours. We don’t keep them, train on them, or
              share them. Fixi is funded by simple subscriptions — no ads and no data deals.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
