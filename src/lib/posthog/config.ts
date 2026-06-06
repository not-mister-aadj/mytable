/** PostHog ingest host (EU by default). */
export function getPostHogIngestHost(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ??
    "https://eu.i.posthog.com"
  );
}

/** PostHog REST API host (EU by default). */
export function getPostHogApiHost(): string {
  return (
    process.env.POSTHOG_API_HOST?.replace(/\/$/, "") ?? "https://eu.posthog.com"
  );
}

export function getPostHogProjectId(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID?.trim();
  return raw || undefined;
}

export function isPostHogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

export function isPostHogAdminConfigured(): boolean {
  return Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY?.trim() &&
      getPostHogProjectId(),
  );
}

export function getPostHogDashboardEmbedUrl(): string | undefined {
  const raw = process.env.POSTHOG_DASHBOARD_EMBED_URL?.trim();
  return raw || undefined;
}
