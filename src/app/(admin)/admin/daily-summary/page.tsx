import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, DollarSign, Package, ShoppingBag, UserCheck, RefreshCw } from "lucide-react";
import { formatPkr } from "@/lib/utils";
import { generateDailyBakeryReport } from "@/lib/reports/daily-bakery-report";

export const metadata = { title: "Daily Summary History (11:00 PM PKT)" };
export const revalidate = 0; // Fresh real-time data

export default async function DailySummaryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ generate?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;

  // Handle manual generation request if triggered
  if (params.generate === "true") {
    await generateDailyBakeryReport();
  }

  // Generate today's report on page load if none exists yet
  const todayPktStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  let todaySummary = await prisma.dailySummary.findFirst({
    where: { businessDate: todayPktStr },
  });

  if (!todaySummary) {
    await generateDailyBakeryReport();
    todaySummary = await prisma.dailySummary.findFirst({
      where: { businessDate: todayPktStr },
    });
  }

  // Fetch all historical daily summaries from real database
  const summaries = await prisma.dailySummary.findMany({
    orderBy: { businessDate: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="📊 Daily Sales & Orders Summary (11:00 PM PKT)"
        description="Official daily business snapshot generated automatically every day at 11:00 PM Pakistan Time (Asia/Karachi)."
        actions={
          <form action="/admin/daily-summary?generate=true" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Generate Summary Now
            </button>
          </form>
        }
      />

      {/* Featured Today's Summary Card */}
      {todaySummary && (
        <Card className="border-2 border-primary/20 bg-card p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  TODAY'S SNAPSHOT
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ID: {todaySummary.summaryId}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">
                Business Date: {todaySummary.businessDate}
              </h2>
              <p className="text-xs text-muted-foreground">
                Timezone: {todaySummary.timezone} • Generated: {new Date(todaySummary.generatedAt).toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" })}
              </p>
            </div>
            <Link
              href={`/admin/daily-summary/${todaySummary.summaryId}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              View Full Report & Order List →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <span className="text-xs text-muted-foreground">Total Orders</span>
              <p className="text-2xl font-bold mt-1">{todaySummary.totalOrders}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-4">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Paid / Verified Sales</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {formatPkr(Number(todaySummary.paidSales))}
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-4">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Pending Payment</span>
              <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {formatPkr(Number(todaySummary.pendingSales))}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <span className="text-xs text-muted-foreground">Net Sales Revenue</span>
              <p className="text-2xl font-bold mt-1">{formatPkr(Number(todaySummary.netSales))}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Historical Summaries Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Historical Daily Summaries</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground">
                <th className="p-3">Summary ID</th>
                <th className="p-3">Business Date</th>
                <th className="p-3">Total Orders</th>
                <th className="p-3">Verified Paid</th>
                <th className="p-3">Pending</th>
                <th className="p-3">Net Sales</th>
                <th className="p-3">Customers</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No daily summary reports recorded yet. Click "Generate Summary Now" above.
                  </td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-medium text-xs text-primary">
                      <Link href={`/admin/daily-summary/${s.summaryId}`} className="hover:underline">
                        {s.summaryId}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold">{s.businessDate}</td>
                    <td className="p-3">{s.totalOrders}</td>
                    <td className="p-3 text-emerald-600 font-semibold">{formatPkr(Number(s.paidSales))}</td>
                    <td className="p-3 text-amber-600">{formatPkr(Number(s.pendingSales))}</td>
                    <td className="p-3 font-bold">{formatPkr(Number(s.netSales))}</td>
                    <td className="p-3">{s.uniqueCustomers}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/daily-summary/${s.summaryId}`}
                        className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-secondary"
                      >
                        Open Report
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
