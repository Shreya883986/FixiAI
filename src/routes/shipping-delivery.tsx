import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/shipping-delivery")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — Fixi AI" },
      { name: "description", content: "How Fixi AI delivers digital image assets and notifications." },
    ],
  }),
  component: ShippingDeliveryPage,
});

function ShippingDeliveryPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Shipping & Delivery</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Fixi AI delivers digital image results instantly through the web app.
        </p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Digital delivery only</h2>
            <p>
              Fixi AI is a fully digital service. There is no physical shipping. When your image is
              processed, the final cutout is available for download directly inside the browser.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Delivery confirmation</h2>
            <p>
              After payment or processing completes, you will see a download link immediately. If
              you are signed in, your processed images are also saved to your account history.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Privacy and security</h2>
            <p>
              Delivered images are private and deleted automatically after 24 hours unless you keep
              them in your account history.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Support</h2>
            <p>
              If your download link fails or you need help after checkout, contact support at
              <a href="mailto:support@fixi.ai" className="text-primary underline">support@fixi.ai</a>.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
