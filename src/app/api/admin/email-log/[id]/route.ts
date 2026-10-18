import { isDbConfigured } from "@/db/index";
import { requireAdminApi } from "@/lib/admin-auth";
import { getLoggedEmailHtml } from "@/lib/email/email-log";

/** The email exactly as it was sent, for the preview in the guest list. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  if (!isDbConfigured()) return new Response("Database not configured", { status: 503 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const mail = await getLoggedEmailHtml(id);
  if (!mail) return new Response("Not found", { status: 404 });

  const html =
    mail.html ??
    `<p style="font-family:sans-serif;padding:24px;color:#2b0d12">Van deze mail is alleen het onderwerp bewaard: <b>${mail.subject
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</b></p>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      // The mail is shown in a sandboxed iframe; it may not run anything.
      "Content-Security-Policy": "script-src 'none'; frame-ancestors 'self'",
    },
  });
}
