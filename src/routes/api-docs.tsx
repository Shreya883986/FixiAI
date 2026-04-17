import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: "API Docs — SnapCut AI" },
      {
        name: "description",
        content:
          "REST API for AI background removal. Simple endpoint, API keys, rate limited, transparent PNG response.",
      },
      { property: "og:title", content: "SnapCut AI — API Documentation" },
      {
        property: "og:description",
        content: "Drop background removal into any workflow with a single HTTP request.",
      },
    ],
  }),
  component: ApiDocsPage,
});

function ApiDocsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-gradient">API</span> Reference
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Programmatic background removal. JSON in, transparent PNG out.
        </p>

        <div className="mt-10 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Beta:</strong> The public B2B API is launching soon. Reach out at{" "}
          <a href="mailto:hi@snapcut.ai" className="underline">hi@snapcut.ai</a> to join the waitlist.
        </div>

        <Section title="Authentication">
          <p>
            All requests require a Bearer token in the <code>Authorization</code> header. Generate
            keys from your dashboard once API access is enabled on your account.
          </p>
          <Code>{`Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx`}</Code>
        </Section>

        <Section title="Remove background">
          <p>POST a publicly reachable image URL or upload a base64 image.</p>
          <Code>{`curl https://api.snapcut.ai/v1/cutout \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://example.com/photo.jpg"
  }'`}</Code>

          <p className="mt-6 font-semibold text-foreground">Response</p>
          <Code>{`{
  "id": "cut_a1b2c3d4",
  "result_url": "https://cdn.snapcut.ai/results/cut_a1b2c3d4.png",
  "expires_at": "2026-04-18T22:00:00Z",
  "credits_remaining": 199
}`}</Code>
        </Section>

        <Section title="Rate limits">
          <ul className="ml-5 list-disc space-y-1">
            <li>Free tier: 5 requests per day per key</li>
            <li>Pro tier: 60 requests per minute per key</li>
            <li>Burst tier (enterprise): contact sales</li>
          </ul>
        </Section>

        <Section title="Errors">
          <Code>{`401 Unauthorized   — invalid or missing API key
402 Payment Required — out of credits
413 Payload Too Large — image exceeds 10 MB
415 Unsupported Media Type — must be JPG, PNG, or WEBP
429 Too Many Requests — rate limited`}</Code>
        </Section>
      </section>
    </MarketingShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-4 space-y-4 text-muted-foreground">{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border/60 bg-card/60 p-4 font-mono text-xs text-foreground">
      <code>{children}</code>
    </pre>
  );
}
