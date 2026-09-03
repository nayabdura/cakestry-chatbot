import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  GaugeCircle,
  LifeBuoy,
  MessagesSquare,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DbNotice,
  DepartmentTag,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/session";
import { dashboardStats, sessionDepartment } from "@/lib/admin/queries";
import { formatDateTime, formatPkr, humanise } from "@/lib/utils";
import type { Department } from "@/lib/brands";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const department = sessionDepartment(session) as Department | null;
  const { data: stats, error } = await dashboardStats(session);

  const showMarketing = department !== "INSTITUTE";
  const showInstitute = department !== "MARKETING";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session.name.split(" ")[0]}`}
        description={
          department
            ? `You're viewing ${department === "MARKETING" ? "Cakestry Bakery" : "Cakestry Special Events"} data.`
            : "Live view across Cakestry Bakery and Special Events."
        }
        actions={
          <Link
            href="/chat"
            className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            Open assistant
          </Link>
        }
      />

      {error && <DbNotice error={error} />}

      {/* Primary widgets */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's chats"
          value={stats.todayChats}
          hint={`${stats.totalConversations} conversations all time`}
          icon={MessagesSquare}
          href="/admin/conversations"
        />
        {showMarketing && (
          <StatCard
            label="Cake Orders"
            value={stats.marketingLeads}
            hint={`${stats.wonLeads} fulfilled`}
            icon={Briefcase}
            department="MARKETING"
            href="/admin/crm/leads"
          />
        )}
        {showInstitute && (
          <StatCard
            label="Event Inquiries"
            value={stats.admissionLeads}
            hint={`${stats.enrolledStudents} booked`}
            icon={ClipboardList}
            department="INSTITUTE"
            href="/admin/crm/admissions"
          />
        )}
        {showMarketing && (
          <StatCard
            label="Order Value"
            value={formatPkr(stats.revenue)}
            hint="Sum of fulfilled cake orders"
            icon={Wallet}
            department="MARKETING"
          />
        )}
      </div>

      {/* Secondary widgets */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open tickets"
          value={stats.openTickets}
          icon={LifeBuoy}
          href="/admin/support/tickets"
        />
        <StatCard
          label="Tastings / Meetings"
          value={stats.upcomingMeetings}
          icon={CalendarClock}
          href="/admin/meetings"
        />
        {showInstitute && (
          <StatCard
            label="Upcoming Events"
            value={stats.upcomingBatches}
            icon={CalendarDays}
            department="INSTITUTE"
            href="/admin/catalogue/batches"
          />
        )}
        <StatCard
          label="Fulfillment rate"
          value={`${stats.conversionRate}%`}
          hint="Completed orders ÷ total inquiries"
          icon={TrendingUp}
          href="/admin/reports"
        />
      </div>

      {/* Popularity + satisfaction */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {showMarketing && (
          <RankedList
            title="Popular Cake Items"
            department="MARKETING"
            rows={stats.popularServices}
            empty="No cake order requests captured yet."
          />
        )}
        {showInstitute && (
          <RankedList
            title="Popular Packages"
            department="INSTITUTE"
            rows={stats.popularCourses}
            empty="No event inquiries captured yet."
          />
        )}

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Star className="size-4 text-accent" />
            <h2 className="text-sm font-semibold">Customer satisfaction</h2>
          </div>
          {stats.satisfaction > 0 ? (
            <>
              <p className="text-3xl font-bold">{stats.satisfaction.toFixed(1)}<span className="text-base font-normal text-muted-foreground"> / 5</span></p>
              <p className="mt-1 text-xs text-muted-foreground">
                Average rating across completed orders.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No ratings yet. Ratings are captured at the end of a conversation.
            </p>
          )}
          <Link
            href="/admin/reports"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <GaugeCircle className="size-3.5" /> Open full reports
          </Link>
        </Card>
      </div>

      {/* Activity feed */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
        {stats.recentActivity.length ? (
          <Card className="divide-y p-0">
            {stats.recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-4">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{humanise(entry.action)}</p>
                  {entry.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{entry.message}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {entry.department && <DepartmentTag department={entry.department} />}
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState
            message="No activity recorded yet."
            hint="Orders, event inquiries, tickets and escalations appear here as they happen."
          />
        )}
      </div>
    </>
  );
}

function RankedList({
  title,
  department,
  rows,
  empty,
}: {
  title: string;
  department: Department;
  rows: Array<{ label: string; count: number }>;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card data-department={department} className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <DepartmentTag department={department} />
      </div>

      {rows.length ? (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{humanise(row.label)}</span>
                <span className="shrink-0 text-muted-foreground">{row.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{empty}</p>
      )}
    </Card>
  );
}
