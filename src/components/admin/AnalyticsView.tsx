import type { AnalyticsSummary } from "@/lib/posthog/admin-stats";
import {
  getPostHogDashboardEmbedUrl,
  isPostHogAdminConfigured,
  isPostHogConfigured,
} from "@/lib/posthog/config";

interface AnalyticsViewProps {
  summary: AnalyticsSummary | null;
}

function StatCard({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format?: "currency";
}) {
  const display =
    format === "currency"
      ? `€${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`
      : value.toLocaleString("nl-NL");

  return (
    <div className="rounded-2xl border border-border-subtle bg-beige p-5">
      <p className="text-sm text-wine/60">{label}</p>
      <p className="mt-1 font-serif text-2xl text-burgundy">{display}</p>
    </div>
  );
}

export function AnalyticsView({ summary }: AnalyticsViewProps) {
  const embedUrl = getPostHogDashboardEmbedUrl();
  const trackingOn = isPostHogConfigured();
  const adminApiOn = isPostHogAdminConfigured();

  if (!trackingOn) {
    return (
      <SetupPanel
        title="PostHog is nog niet gekoppeld"
        steps={[
          "Maak een project op eu.posthog.com",
          "Voeg NEXT_PUBLIC_POSTHOG_KEY toe aan .env.local en Vercel",
          "Optioneel: NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com",
          "Redeploy en test op mytable.club",
        ]}
      />
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-burgundy">Analytics</h1>
        <p className="mt-2 text-sm text-wine/70">
          CEO-overzicht — traffic, intent, checkout, revenue (7 dagen).
        </p>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Betaalde boekingen (7d)" value={summary.paymentsCompleted7d} />
          <StatCard label="Stoelen geboekt (7d)" value={summary.seatsBooked7d} />
          <StatCard label="Omzet (7d)" value={summary.revenue7d} format="currency" />
          <StatCard label="Event detail views (7d)" value={summary.eventDetailViews7d} />
          <StatCard label="Pageviews (7d)" value={summary.pageviews7d} />
          <StatCard label="Checkout gestart (7d)" value={summary.checkoutStarted7d} />
          <StatCard label="Wachtlijst (7d)" value={summary.waitlistSignups7d} />
        </div>
      ) : (
        <SetupPanel
          title="Admin-statistieken vereisen een PostHog API key"
          steps={[
            "PostHog → Settings → Personal API keys → Create key",
            "Voeg POSTHOG_PERSONAL_API_KEY toe (Vercel Production, sensitive)",
            "Voeg NEXT_PUBLIC_POSTHOG_PROJECT_ID toe (Project Settings → Project ID)",
            "Redeploy — daarna verschijnen de kaarten hier",
          ]}
        />
      )}

      {embedUrl ? (
        <section>
          <h2 className="mb-4 text-lg font-medium text-burgundy">
            MyTable Growth Dashboard
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-beige">
            <iframe
              src={embedUrl}
              title="PostHog dashboard"
              className="h-[720px] w-full"
              allowFullScreen
            />
          </div>
        </section>
      ) : adminApiOn ? (
        <p className="text-sm text-wine/60">
          Run{" "}
          <code className="rounded bg-cream px-1.5 py-0.5">
            npm run posthog:setup-dashboards
          </code>{" "}
          om dashboards aan te maken, of zet{" "}
          <code className="rounded bg-cream px-1.5 py-0.5">
            POSTHOG_DASHBOARD_EMBED_URL
          </code>{" "}
          handmatig.
        </p>
      ) : null}

      <p className="text-sm text-wine/60">
        Volledige analyse (funnels, city/event breakdown) →{" "}
        <a
          href="https://eu.posthog.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-burgundy underline-offset-2 hover:underline"
        >
          PostHog openen
        </a>
      </p>
    </div>
  );
}

function SetupPanel({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-beige p-6">
      <h2 className="font-serif text-xl text-burgundy">{title}</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-wine/80">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
