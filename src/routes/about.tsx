import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SnapCut AI" },
      {
        name: "description",
        content:
          "SnapCut AI is a focused AI background-removal tool built for creators, sellers, and developers.",
      },
      { property: "og:title", content: "About SnapCut AI" },
      { property: "og:description", content: "Why we built SnapCut AI." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight">
          About <span className="text-gradient">SnapCut AI</span>
        </h1>
        <div className="mt-8 space-y-4 text-lg text-muted-foreground">
          <p>
            We started SnapCut AI because every existing background remover felt like it was built
            for someone else. Bloated editors. Watermarks. Uploads that took longer than the actual
            cutout.
          </p>
          <p>
            SnapCut does one thing: it removes backgrounds with AI, fast, and gives you a clean
            transparent PNG. That's it. No editor, no upsell, no signup wall to see the result.
          </p>
          <p>
            Your images are auto-deleted after 24 hours. We don't keep them, train on them, or share
            them. The product is funded by simple subscriptions — no ads, no data deals.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
