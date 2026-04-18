import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Fixi AI" },
      { name: "description", content: "Get in touch with the Fixi AI team." },
      { property: "og:title", content: "Contact Fixi AI" },
      { property: "og:description", content: "Reach out for support, feedback, or partnerships." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Get in <span className="text-gradient">touch</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We read every message. Usually reply in under a day.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <a
            href="mailto:hi@fixi.ai"
            className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm"
          >
            <Mail className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Email</h3>
            <p className="mt-1 text-sm text-muted-foreground">hi@fixi.ai</p>
          </a>
          <a
            href="#"
            className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-glow-sm"
          >
            <MessageCircle className="h-8 w-8 text-accent" />
            <h3 className="mt-4 text-lg font-semibold">Discord</h3>
            <p className="mt-1 text-sm text-muted-foreground">Join our community</p>
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
