import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createRazorpayOrder } from "@/server/razorpay";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Fixi AI" },
      {
        name: "description",
        content:
          "Simple pricing for AI background removal. Start free with 5 images per day. Go Pro for unlimited.",
      },
      { property: "og:title", content: "Fixi AI Pricing" },
      { property: "og:description", content: "Free to start. Pro for unlimited cutouts." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    desc: "Perfect for trying it out and occasional use.",
    cta: "Start free",
    href: "/register",
    variant: "glow" as const,
    features: [
      "5 images per day",
      "Up to 10 MB per image",
      "PNG output with transparency",
      "24h auto-delete",
      "Web app access",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per month",
    desc: "For creators, sellers, and small teams.",
    cta: "Upgrade to Pro",
    variant: "hero" as const,
    featured: true,
    payment: true,
    amount: 1200,
    currency: "INR",
    features: [
      "Unlimited images",
      "Priority processing queue",
      "Up to 10 MB per image",
      "Batch upload (coming soon)",
      "Email support",
    ],
  },
  {
    name: "Pack",
    price: "$19",
    cadence: "one-time · 200 credits",
    desc: "Top-up that never expires. Pay as you go.",
    cta: "Buy a pack",
    variant: "glow" as const,
    custom: true,
    payment: true,
    amount: 1900,
    currency: "INR",
    features: [
      "200 image credits",
      "Credits never expire",
      "Stack with any plan",
      "All Pro features per credit",
    ],
  },
];

function PricingPage() {
  const navigate = useNavigate();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const loadRazorpayScript = useCallback(async () => {
    if (typeof window === "undefined") return false;
    if ((window as any).Razorpay) return true;

    return new Promise<boolean>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout script."));
      document.body.appendChild(script);
    });
  }, []);

  const handleCheckout = useCallback(
    async (tier: (typeof tiers)[number]) => {
      if (!tier.payment) return;
      setIsCheckoutLoading(true);

      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Unable to load Razorpay checkout. Try again later.");
        }

        const orderData = {
          amount: tier.amount,
          currency: tier.currency,
          receipt: `fixi-${tier.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          notes: {
            plan: tier.name,
            business_name: "Fixi AI",
          },
        };

        const orderResponse = await createRazorpayOrder({ data: orderData });

        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          throw new Error("Razorpay checkout is not available.");
        }

        const checkout = new Razorpay({
          key: orderResponse.keyId,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          order_id: orderResponse.orderId,
          name: "Fixi AI",
          description: `${tier.name} purchase`,
          theme: { color: "#48B5FF" },
          notes: {
            plan: tier.name,
            website: "https://fixi.ai",
          },
          handler: (response: any) => {
            toast.success("Payment completed successfully.");
            setIsCheckoutLoading(false);
          },
          modal: {
            ondismiss: () => {
              setIsCheckoutLoading(false);
            },
          },
        });

        checkout.open();
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
        setIsCheckoutLoading(false);
      }
    },
    [loadRazorpayScript],
  );

  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Pick your <span className="text-gradient">plan</span>.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade anytime. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 backdrop-blur-sm transition-all ${
                tier.custom
                  ? "border-border/60 bg-card/40"
                  : tier.featured
                  ? "border-primary/50 bg-card/60 shadow-glow"
                  : "border-border/60 bg-card/40 hover:border-primary/30"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow-sm">
                    Most popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
                <span className="text-sm text-muted-foreground">/ {tier.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{tier.desc}</p>

              {tier.payment ? (
                <Button
                  type="button"
                  variant={tier.variant}
                  size="lg"
                  className="mt-6 w-full"
                  onClick={() => handleCheckout(tier)}
                  disabled={isCheckoutLoading}
                >
                  {isCheckoutLoading ? "Processing..." : tier.cta}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={tier.variant}
                  size="lg"
                  className="mt-6 w-full"
                  onClick={() => navigate({ to: tier.href })}
                >
                  {tier.cta}
                </Button>
              )}

              <ul className="mt-8 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          All prices shown are in USD-style labels, with Razorpay checkout processing INR amounts.
          Payments are handled through the Razorpay popup.
        </p>
      </section>
    </MarketingShell>
  );
}
