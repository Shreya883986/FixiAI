import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing — SnapCut AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan and credits.
        </p>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Current plan
              </p>
              <p className="mt-1 text-2xl font-bold capitalize">{profile?.plan ?? "free"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Credits</p>
              <p className="mt-1 text-2xl font-bold">
                {profile?.plan === "pro" ? "∞" : profile?.credits_remaining ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <PlanBox
            name="Pro Monthly"
            price="$12 / mo"
            features={["Unlimited images", "Priority queue", "Email support"]}
            cta="Upgrade to Pro"
          />
          <PlanBox
            name="Credit Pack"
            price="$19 one-time"
            features={["200 credits", "Never expire", "Stack with any plan"]}
            cta="Buy 200 credits"
          />
        </div>

        <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-medium">Payments not yet connected</p>
          <p className="mt-1 text-amber-200/80">
            To enable real Pro upgrades and credit packs, connect Stripe payments to this project.
            Until then, all accounts run on the Free plan.{" "}
            <Link to="/pricing" className="underline">View plans</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

function PlanBox({
  name,
  price,
  features,
  cta,
}: {
  name: string;
  price: string;
  features: string[];
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      <Button variant="hero" size="lg" className="mt-6 w-full" disabled>
        {cta}
      </Button>
    </div>
  );
}
