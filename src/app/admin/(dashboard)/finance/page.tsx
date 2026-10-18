import { headers } from "next/headers";
import { FinanceView } from "@/components/admin/FinanceView";
import { requireAdmin } from "@/lib/admin-auth";
import { getFinanceData, parseFinanceGranularity } from "@/lib/admin-finance";
import { adminPath, resolveHostname } from "@/lib/admin-url";

type Props = { searchParams: Promise<{ per?: string }> };

export default async function AdminFinancePage({ searchParams }: Props) {
  await requireAdmin();
  const { per } = await searchParams;
  const data = await getFinanceData(parseFinanceGranularity(per));

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  return <FinanceView data={data} basePath={adminPath("/finance", hostname)} />;
}
