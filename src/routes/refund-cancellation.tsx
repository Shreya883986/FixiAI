import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/refund-cancellation")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation — Fixi AI" },
      { name: "description", content: "Fixi AI refund, cancellation and credit policy." },
    ],
  }),
  component: RefundCancellationPage,
});

function RefundCancellationPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Refund & Cancellation</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Fixi AI is committed to transparent digital payments and fair customer support.
        </p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Digital service refunds</h2>
            <p>
              Fixi AI delivers background removal as a digital service. Once an image has been
              processed, the output is available immediately and no physical goods are shipped.
            </p>
            <p className="mt-2">
              Refunds are evaluated on a case-by-case basis for technical failures, duplicate
              purchases, or payment processing issues. Please contact support within 7 days of
              purchase to request assistance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Credit pack cancellation</h2>
            <p>
              Credit packs purchased for Fixi AI are prepaid digital credits. These packs are
              non-refundable once the transaction is completed, but credits do not expire.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Subscription cancellation</h2>
            <p>
              Pro subscriptions can be canceled at any time from the billing page. Cancellation
              stops auto-renewal immediately, while access continues through the current billing
              period.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">How to request a refund</h2>
            <p>
              Email support@fixi.ai with your order details and a short explanation. We aim to
              respond within 24 hours on business days.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
