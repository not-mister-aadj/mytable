import type { AnalyticsSummary } from "@/lib/posthog/admin-stats";
import {
  getPostHogDashboardEmbedUrl,
  getPostHogGrowthDashboardUrl,
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

function FunnelStrip({ steps }: { steps: AnalyticsSummary["funnel7d"] }) {
  const max = Math.max(...steps.map((s) => s.count), 1);

  return (
    <section className="rounded-2xl border border-border-subtle bg-beige p-6">
      <h2 className="text-lg font-medium text-burgundy">Groei-funnel (7 dagen)</h2>
      <p className="mt-1 text-sm text-wine/60">
        Stappen op mytable.club — vult aan naarmate er traffic binnenkomt.
      </p>
      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const prev = index > 0 ? steps[index - 1].count : null;
          const conversion =
            prev && prev > 0
              ? `${Math.round((step.count / prev) * 100)}%`
              : "—";
          const width = `${Math.max(8, (step.count / max) * 100)}%`;

          return (
            <li key={step.label} className="grid gap-2 sm:grid-cols-[140px_1fr_72px_56px] sm:items-center">
              <span className="text-sm font-medium text-wine">{step.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-cream">
                <div
                  className="h-full rounded-full bg-burgundy/80"
                  style={{ width }}
                />
              </div>
              <span className="text-sm tabular-nums text-wine/80">{step.count}</span>
              <span className="text-xs text-wine/50">{conversion}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function AnalyticsView({ summary }: AnalyticsViewProps) {
  const embedUrl = getPostHogDashboardEmbedUrl();
  const growthDashboardUrl = getPostHogGrowthDashboardUrl();
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-burgundy">Analytics</h1>
          <p className="mt-2 text-sm text-wine/70">
            CEO-overzicht — traffic, intent, checkout, revenue (7 dagen).
          </p>
        </div>
        {adminApiOn ? (
          <a
            href={growthDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream hover:bg-wine"
          >
            Open Growth Dashboard in PostHog →
          </a>
        ) : null}
      </div>

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Betaalde boekingen (7d)" value={summary.paymentsCompleted7d} />
            <StatCard label="Stoelen geboekt (7d)" value={summary.seatsBooked7d} />
            <StatCard label="Omzet (7d)" value={summary.revenue7d} format="currency" />
            <StatCard label="Event detail views (7d)" value={summary.eventDetailViews7d} />
            <StatCard label="Pageviews (7d)" value={summary.pageviews7d} />
            <StatCard label="Checkout gestart (7d)" value={summary.checkoutStarted7d} />
            <StatCard label="Wachtlijst (7d)" value={summary.waitlistSignups7d} />
          </div>
          <FunnelStrip steps={summary.funnel7d} />
        </>
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
      ) : null}

      {adminApiOn && !embedUrl ? (
        <p className="text-sm text-wine/60">
          Charts & breakdowns staan in{" "}
          <a
            href={growthDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy underline-offset-2 hover:underline"
          >
            MyTable Growth Dashboard
          </a>
          . Voor een embed hier: PostHog → Share → Embed → zet{" "}
          <code className="rounded bg-cream px-1.5 py-0.5">
            POSTHOG_DASHBOARD_EMBED_URL
          </code>{" "}
          op Vercel.
        </p>
      ) : null}
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
