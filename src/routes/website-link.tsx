import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/website-link")({
  head: () => ({
    meta: [
      { title: "Website Link — Fixi AI" },
      { name: "description", content: "Official Fixi AI website and merchant details." },
    ],
  }),
  component: WebsiteLinkPage,
});

function WebsiteLinkPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Website Link</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Fixi AI is the official AI background removal service for creators, sellers, and teams.
        </p>

        <div className="mt-10 space-y-6 text-muted-foreground">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Official website</h2>
            <p className="mt-2">
              <a
                href="https://fixi.ai"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                https://fixi.ai
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Business details</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Business name: Fixi AI</li>
              <li>Trade name: Fixi AI</li>
              <li>Service: AI-powered image background removal</li>
              <li>Contact: support@fixi.ai</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Razorpay-ready merchant page</h2>
            <p>
              This page is designed to provide Razorpay and other payment partners with the official
              website link and business identity for Fixi AI.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
