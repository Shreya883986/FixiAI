import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SnapCut AI" },
      { name: "description", content: "How SnapCut AI handles your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-muted-foreground">
          <Block title="What we collect">
            <p>
              Account email, an optional display name, your uploaded images, and processing
              metadata (file size, timestamps, status). That's it.
            </p>
          </Block>
          <Block title="What we do with your images">
            <p>
              We process them through a third-party AI vision model to remove the background, then
              store the result so you can download it. Images are deleted from our storage after 24
              hours, automatically.
            </p>
          </Block>
          <Block title="What we don't do">
            <ul className="ml-5 list-disc space-y-1">
              <li>We don't sell your data.</li>
              <li>We don't train AI models on your images.</li>
              <li>We don't share images with third parties beyond the processing API.</li>
            </ul>
          </Block>
          <Block title="Your rights">
            <p>
              You can delete your account and all associated data at any time from the dashboard.
              Email <a href="mailto:hi@snapcut.ai" className="text-primary">hi@snapcut.ai</a> with
              questions.
            </p>
          </Block>
        </div>
      </section>
    </MarketingShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}
