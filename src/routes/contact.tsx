import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Fixi AI" },
      { name: "description", content: "Contact Fixi AI for support, billing, or partnership inquiries." },
      { property: "og:title", content: "Contact Fixi AI" },
      { property: "og:description", content: "Reach out to Fixi AI for payments, support, or business questions." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Contact <span className="text-gradient">Fixi AI</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Need help with payments, image processing, or business inquiries? Reach out to our team.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <a
            href="mailto:support@fixi.ai"
            className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm"
          >
            <Mail className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Email</h3>
            <p className="mt-1 text-sm text-muted-foreground">support@fixi.ai</p>
          </a>
          <div className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm">
            <Phone className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Phone</h3>
            <p className="mt-1 text-sm text-muted-foreground">+91 98765 43210</p>
          </div>
          <div className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm">
            <MapPin className="h-8 w-8 text-accent" />
            <h3 className="mt-4 text-lg font-semibold">Address</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Fixi AI, 1 Innovation Lane, Bangalore Tech Park, Bangalore 560001, India
            </p>
          </div>
          <div className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm">
            <Building2 className="h-8 w-8 text-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Trade name</h3>
            <p className="mt-1 text-sm text-muted-foreground">Fixi AI</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
