import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb, isDbConfigured } from "@/db/index";
import {
  affiliateCodes,
  affiliateCommissions,
  bookings,
} from "@/db/schema";

export default async function AdminAffiliatesPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const db = getDb();
  const codes = await db
    .select()
    .from(affiliateCodes)
    .orderBy(desc(affiliateCodes.createdAt));

  const commissions = await db
    .select({
      id: affiliateCommissions.id,
      amountCents: affiliateCommissions.amountCents,
      status: affiliateCommissions.status,
      createdAt: affiliateCommissions.createdAt,
      code: affiliateCodes.code,
      name: affiliateCodes.name,
      bookingEmail: bookings.email,
      seats: bookings.seats,
    })
    .from(affiliateCommissions)
    .innerJoin(
      affiliateCodes,
      eq(affiliateCommissions.affiliateCodeId, affiliateCodes.id),
    )
    .innerJoin(bookings, eq(affiliateCommissions.bookingId, bookings.id))
    .orderBy(desc(affiliateCommissions.createdAt))
    .limit(100);

  const pendingCents = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amountCents, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-wine">Affiliates</h1>
        <p className="mt-1 text-sm text-wine/60">
          Ambassador codes and culinary commissions. Pending payout: €
          {(pendingCents / 100).toFixed(2)}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-wine/50">
          Codes
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-wine/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-wine/10 text-wine/50">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">€ / ticket</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => (
                <tr key={row.id} className="border-b border-wine/5">
                  <td className="px-4 py-3 font-mono text-wine">{row.code}</td>
                  <td className="px-4 py-3 text-wine">{row.name}</td>
                  <td className="px-4 py-3">{row.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    €{(row.commissionCentsPerTicket / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
              {codes.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-wine/50" colSpan={4}>
                    No codes yet. Cron seeds AMS01 / RTM01 / UTR01.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-wine/50">
          Commissions
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-wine/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-wine/10 text-wine/50">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((row) => (
                <tr key={row.id} className="border-b border-wine/5">
                  <td className="px-4 py-3 text-wine/70">
                    {row.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 font-mono">{row.code}</td>
                  <td className="px-4 py-3">{row.bookingEmail}</td>
                  <td className="px-4 py-3">{row.seats}</td>
                  <td className="px-4 py-3">
                    €{(row.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
              {commissions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-wine/50" colSpan={6}>
                    No commissions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
