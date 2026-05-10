import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Fixi AI" },
      { name: "description", content: "Fixi AI terms of service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

        <div className="mt-10 space-y-6 text-muted-foreground">
          <Block title="Acceptable use">
            <p>
              Don't upload images you don't own or have rights to. Don't use Fixi AI for illegal
              content, including CSAM, non-consensual imagery, or content that infringes third-party
              rights. We will terminate accounts that violate this.
            </p>
          </Block>
          <Block title="Service availability">
            <p>
              We aim for 99.5% uptime but don't guarantee it. Processing is provided on a
              best-effort basis. If a processing job fails, no credit is consumed.
            </p>
          </Block>
          <Block title="Billing">
            <p>
              Subscriptions auto-renew until cancelled. Cancel anytime from billing settings.
              One-time credit packs are non-refundable but never expire.
            </p>
          </Block>
          <Block title="Limitation of liability">
            <p>
              Service provided "as is" without warranty. Maximum liability limited to fees paid in
              the prior 12 months.
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
      <div className="mt-2">{children}</div>
    </div>
  );
}
