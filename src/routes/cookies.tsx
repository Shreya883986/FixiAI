import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies Policy — Fixi AI" },
      { name: "description", content: "How Fixi AI uses cookies." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold">Cookies Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-muted-foreground">
          <Block title="What are cookies?">
            <p>
              Cookies are small text files stored on your device that help us recognize you when you
              return to Fixi AI. They enhance your experience by remembering your preferences,
              keeping you logged in, and helping us understand how you use our service.
            </p>
          </Block>

          <Block title="Types of cookies we use">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Essential Cookies</h3>
                <p className="mt-1">
                  Required for basic functionality. These enable you to log in, stay authenticated,
                  and use core features like image processing. You cannot disable these without
                  breaking the service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Performance Cookies</h3>
                <p className="mt-1">
                  Help us understand how you use Fixi AI. We collect anonymous data about page
                  load times, feature usage, and errors to improve performance. This data is never
                  linked to your personal identity.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Marketing Cookies</h3>
                <p className="mt-1">
                  Used to track conversion metrics and improve marketing campaigns. These may be set
                  by advertising partners to measure campaign effectiveness. You can disable these
                  in your cookie preferences.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Third-party Cookies</h3>
                <p className="mt-1">
                  Partners like payment providers (Razorpay), analytics services, and CDNs may set
                  their own cookies. Review their privacy policies for details on how they use
                  cookies.
                </p>
              </div>
            </div>
          </Block>

          <Block title="Specific cookies we use">
            <div className="space-y-3">
              <div className="rounded border border-border/50 bg-card/20 p-3">
                <p>
                  <strong className="text-foreground">auth_token</strong> — Stores your session token
                  for authentication (Essential)
                </p>
              </div>
              <div className="rounded border border-border/50 bg-card/20 p-3">
                <p>
                  <strong className="text-foreground">user_preferences</strong> — Remembers your UI
                  theme, language, and display settings (Essential)
                </p>
              </div>
              <div className="rounded border border-border/50 bg-card/20 p-3">
                <p>
                  <strong className="text-foreground">_ga, _gid</strong> — Google Analytics cookies for
                  site usage statistics (Performance)
                </p>
              </div>
              <div className="rounded border border-border/50 bg-card/20 p-3">
                <p>
                  <strong className="text-foreground">razorpay_session</strong> — Used during payment
                  processing with Razorpay (Essential for transactions)
                </p>
              </div>
            </div>
          </Block>

          <Block title="Third-party services">
            <p>We use cookies from these third-party services:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Google Analytics</strong> — Analyzes website traffic and user behavior
              </li>
              <li>
                <strong>Razorpay</strong> — Payment processing and fraud detection
              </li>
              <li>
                <strong>Cloudflare</strong> — CDN and security services
              </li>
              <li>
                <strong>Sentry</strong> — Error tracking and performance monitoring
              </li>
            </ul>
          </Block>

          <Block title="Controlling cookies">
            <p>You can manage cookies through your browser settings:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Chrome</strong> — Settings → Privacy and security → Cookies and other site
                data
              </li>
              <li>
                <strong>Firefox</strong> — Options → Privacy & Security → Cookies and Site Data
              </li>
              <li>
                <strong>Safari</strong> — Preferences → Privacy → Manage Website Data
              </li>
              <li>
                <strong>Edge</strong> — Settings → Privacy, search, and services → Clear browsing
                data
              </li>
            </ul>
            <p className="mt-3">
              Note: Disabling essential cookies may prevent you from using Fixi AI properly.
            </p>
          </Block>

          <Block title="Do Not Track (DNT)">
            <p>
              Some browsers include a "Do Not Track" feature. While we respect this preference, we
              still use essential cookies required for service operation. DNT does not prevent
              essential functionality cookies.
            </p>
          </Block>

          <Block title="Cookie retention">
            <p>
              Session cookies are deleted when you log out or close your browser. Persistent cookies
              are retained for up to 1 year, depending on the cookie type. You can delete cookies
              manually at any time.
            </p>
          </Block>

          <Block title="International compliance">
            <p>
              We comply with GDPR, CCPA, and other privacy regulations regarding cookie usage. If
              you're in the EU, we obtain explicit consent before setting non-essential cookies. You
              can withdraw consent at any time.
            </p>
          </Block>

          <Block title="Updates to this policy">
            <p>
              We may update this cookies policy as our services evolve. We'll notify you of
              significant changes via email or through a prominent notice on our website.
            </p>
          </Block>

          <Block title="Questions?">
            <p>
              For questions about our cookies policy, contact us at{" "}
              <a href="mailto:hi@fixi.ai" className="text-primary">
                hi@fixi.ai
              </a>
              .
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
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}
