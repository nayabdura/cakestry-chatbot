import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { formatPkr } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Clock, Truck, User, XCircle } from "lucide-react";

export const metadata = { title: "Daily Summary Detail" };
export const revalidate = 0;

export default async function DailySummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const resolvedParams = await params;
  const summaryId = resolvedParams.id;

  const summary = await prisma.dailySummary.findUnique({
    where: { summaryId },
  });

  if (!summary) {
    notFound();
  }

  const orderDetails = (summary.orderDetails as any[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/daily-summary" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Daily Summaries
        </Link>
      </div>

      <PageHeader
        title={`📊 Daily Summary: ${summary.summaryId}`}
        description={`Official Report for Business Date ${summary.businessDate} (${summary.timezone})`}
      />

      {/* Summary KPI Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">Business Date</span>
          <p className="text-xl font-bold mt-1">{summary.businessDate}</p>
          <span className="text-[10px] text-muted-foreground">Timezone: {summary.timezone}</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">Total Orders</span>
          <p className="text-xl font-bold mt-1">{summary.totalOrders}</p>
          <span className="text-[10px] text-muted-foreground">{summary.deliveryOrders} Delivery • {summary.pickupOrders} Pickup</span>
        </Card>
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Verified Paid Sales</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatPkr(Number(summary.paidSales))}
          </p>
        </Card>
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Payment</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatPkr(Number(summary.pendingSales))}
          </p>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">Gross Sales</span>
          <p className="text-lg font-bold mt-1">{formatPkr(Number(summary.grossSales))}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">Total Discounts</span>
          <p className="text-lg font-bold mt-1 text-muted-foreground">{formatPkr(Number(summary.discountTotal))}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">Cancelled Orders</span>
          <p className="text-lg font-bold mt-1 text-rose-500">{summary.cancelledOrders}</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">Unique Customers</span>
          <p className="text-lg font-bold mt-1">{summary.uniqueCustomers}</p>
        </Card>
      </div>

      {/* Individual Included Orders Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Included Production Orders ({orderDetails.length})</h3>

        {orderDetails.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No orders recorded for this business day.</p>
        ) : (
          <div className="space-y-4">
            {orderDetails.map((o: any, idx: number) => (
              <div key={o.id || idx} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">#{idx + 1} Ref: {o.reference}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                      {o.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold text-base">{formatPkr(Number(o.amount))}</span>
                    <Link
                      href={`/admin/crm/leads/${o.id}`}
                      className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      View Real Order →
                    </Link>
                  </div>
                </div>

                <div className="grid gap-2 text-xs md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>{" "}
                    <span className="font-semibold">{o.customerName}</span> ({o.phone})
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Date:</span>{" "}
                    <span>{new Date(o.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</span>
                  </div>
                </div>

                {o.requirements && (
                  <div className="mt-3 rounded bg-muted/50 p-2.5 text-xs font-mono whitespace-pre-wrap">
                    {o.requirements}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
