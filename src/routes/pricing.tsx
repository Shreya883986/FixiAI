import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createRazorpayOrder } from "@/actions/razorpay";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Fixi AI" },
      {
        name: "description",
        content:
          "Simple pricing for AI background removal. Start free with 2 credits. Go Pro for 10 credits.",
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
    price: "₹0",
    cadence: "forever",
    desc: "A free daily allowance for light background removal.",
    cta: "Start free",
    href: "/register",
    variant: "glow" as const,
    features: [
      "2 free credits after signup",
      "Standard quality output",
      "Basic formats allowed (JPG, PNG)",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    cadence: "per month",
    desc: "For creators and sellers who process images regularly.",
    cta: "Upgrade to Pro",
    variant: "hero" as const,
    featured: true,
    payment: true,
    amount: 49900,
    currency: "INR",
    features: [
      "10 credits for one month",
      "HD quality outputs",
      "All formats (PNG, WEBP, JPG)",
      "API access (1000 calls/mo)",
    ],
  },
  {
    name: "Pack",
    price: "₹999",
    cadence: "per month",
    desc: "For teams and automation-heavy workflows.",
    cta: "Buy a pack",
    variant: "glow" as const,
    custom: true,
    payment: true,
    amount: 99900,
    currency: "INR",
    features: ["Everything in Pro", "Unlimited calls", "Customer support"],
  },
];

function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
          handler: async (response: any) => {
            if (user && tier.name === "Pro") {
              await supabase
                .from("profiles")
                .update({
                  plan: "pro",
                  credits_remaining: 10,
                  credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .eq("id", user.id);
            }
            toast.success("Payment completed successfully.");
            setIsCheckoutLoading(false);
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              setIsCheckoutLoading(false);
            },
          },
          retry: { enabled: true, max_count: 3 },
        });

        checkout.open();
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
        setIsCheckoutLoading(false);
      }
    },
    [loadRazorpayScript, user],
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
          All prices are shown in INR. Payments are handled securely through Razorpay.
        </p>
      </section>
    </MarketingShell>
  );
}
