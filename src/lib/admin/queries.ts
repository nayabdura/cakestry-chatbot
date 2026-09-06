import type { Department } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

/**
 * =============================================================================
 *  Admin data access
 * =============================================================================
 *
 *  Every admin page is a server component that queries Prisma directly. Two
 *  concerns are centralised here:
 *
 *   1. **Failure tolerance** — `safeQuery` turns a database outage (or a
 *      developer running without DATABASE_URL) into an empty result plus an
 *      error string, so the console renders a notice instead of a 500.
 *
 *   2. **Department scoping** — `scope()` turns a session into a `where`
 *      fragment. Staff assigned to one business can never read the other's
 *      records, even by typing the URL directly.
 * =============================================================================
 */

export interface QueryResult<T> {
  data: T;
  error?: string;
}

/** Run a query, falling back to `fallback` and capturing the error message. */
export async function safeQuery<T>(
  run: () => Promise<T>,
  fallback: T
): Promise<QueryResult<T>> {
  try {
    return { data: await run() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[admin] query failed:", message);
    return { data: fallback, error: message.split("\n")[0] };
  }
}

/** The department a session is restricted to, or null for unrestricted staff. */
export function sessionDepartment(session: SessionPayload): Department | null {
  if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") return null;
  return (session.department as Department) ?? null;
}

/**
 * `where` fragment scoping a query to the session's department.
 * Returns `{}` for unrestricted staff so the same call site works for both.
 */
export function scope(session: SessionPayload): { department?: Department } {
  const department = sessionDepartment(session);
  return department ? { department } : {};
}

/** Granted permission keys, or null when the role has unrestricted access. */
export async function loadPermissions(
  session: SessionPayload
): Promise<Set<string> | null> {
  if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        rbac: { select: { permissions: { select: { permission: { select: { key: true } } } } } },
      },
    });
    const keys = user?.rbac?.permissions.map((p) => p.permission.key) ?? [];
    // A staff account with no role assigned still needs the dashboard, or they
    // sign in to a blank console with no way forward.
    return new Set(keys.length ? keys : ["dashboard.view"]);
  } catch {
    return new Set(["dashboard.view"]);
  }
}

// --------------------------------------------------------------- Badges -----

export interface NavCounts {
  openTickets: number;
  newLeads: number;
  newAdmissions: number;
}

/** Small live counts rendered as pills in the sidebar. */
export async function navCounts(session: SessionPayload): Promise<NavCounts> {
  const department = sessionDepartment(session);
  const empty: NavCounts = { openTickets: 0, newLeads: 0, newAdmissions: 0 };

  const { data } = await safeQuery(async () => {
    const [openTickets, newLeads, newAdmissions] = await Promise.all([
      prisma.ticket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] }, ...(department ? { department } : {}) },
      }),
      department === "INSTITUTE"
        ? Promise.resolve(0)
        : prisma.marketingLead.count({ where: { stage: "NEW" } }),
      department === "MARKETING"
        ? Promise.resolve(0)
        : prisma.admission.count({ where: { stage: "INQUIRY" } }),
    ]);
    return { openTickets, newLeads, newAdmissions };
  }, empty);

  return data;
}

// ------------------------------------------------------------ Dashboard -----

export interface DashboardStats {
  todayChats: number;
  totalConversations: number;
  marketingLeads: number;
  admissionLeads: number;
  wonLeads: number;
  enrolledStudents: number;
  revenue: number;
  openTickets: number;
  upcomingMeetings: number;
  upcomingBatches: number;
  conversionRate: number;
  satisfaction: number;
  popularServices: Array<{ label: string; count: number }>;
  popularCourses: Array<{ label: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    message: string | null;
    department: Department | null;
    createdAt: Date;
  }>;
}

const EMPTY_STATS: DashboardStats = {
  todayChats: 0,
  totalConversations: 0,
  marketingLeads: 0,
  admissionLeads: 0,
  wonLeads: 0,
  enrolledStudents: 0,
  revenue: 0,
  openTickets: 0,
  upcomingMeetings: 0,
  upcomingBatches: 0,
  conversionRate: 0,
  satisfaction: 0,
  popularServices: [],
  popularCourses: [],
  recentActivity: [],
};

/** Everything the dashboard widgets need, in one round of parallel queries. */
export async function dashboardStats(
  session: SessionPayload
): Promise<QueryResult<DashboardStats>> {
  const department = sessionDepartment(session);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const now = new Date();

  return safeQuery(async () => {
    const departmentWhere = department ? { department } : {};

    const [
      todayChats,
      totalConversations,
      marketingLeads,
      admissionLeads,
      wonLeads,
      enrolledStudents,
      wonValue,
      openTickets,
      upcomingMeetings,
      upcomingBatches,
      ratings,
      serviceGroups,
      courseGroups,
      recentActivity,
    ] = await Promise.all([
      prisma.conversation.count({
        where: { createdAt: { gte: startOfToday }, ...departmentWhere },
      }),
      prisma.conversation.count({ where: departmentWhere }),
      department === "INSTITUTE" ? Promise.resolve(0) : prisma.marketingLead.count(),
      department === "MARKETING" ? Promise.resolve(0) : prisma.admission.count(),
      department === "INSTITUTE"
        ? Promise.resolve(0)
        : prisma.marketingLead.count({ where: { stage: "WON" } }),
      department === "MARKETING"
        ? Promise.resolve(0)
        : prisma.admission.count({ where: { stage: "ENROLLED" } }),
      department === "INSTITUTE"
        ? Promise.resolve(null)
        : prisma.marketingLead.aggregate({
            where: { estimatedValue: { not: null } },
            _sum: { estimatedValue: true },
          }),
      prisma.ticket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] }, ...departmentWhere },
      }),
      prisma.meeting.count({
        where: {
          preferredDate: { gte: startOfToday },
          status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] },
          ...departmentWhere,
        },
      }),
      department === "MARKETING"
        ? Promise.resolve(0)
        : prisma.batch.count({
            where: { startDate: { gte: now }, status: { in: ["PLANNED", "ENROLLING"] } },
          }),
      prisma.conversation.aggregate({
        where: { rating: { not: null }, ...departmentWhere },
        _avg: { rating: true },
      }),
      department === "INSTITUTE"
        ? Promise.resolve([])
        : prisma.marketingLead.groupBy({
            by: ["serviceSlug"],
            _count: { _all: true },
            where: { serviceSlug: { not: null } },
            orderBy: { _count: { serviceSlug: "desc" } },
            take: 5,
          }),
      department === "MARKETING"
        ? Promise.resolve([])
        : prisma.admission.groupBy({
            by: ["courseName"],
            _count: { _all: true },
            where: { courseName: { not: null } },
            orderBy: { _count: { courseName: "desc" } },
            take: 5,
          }),
      prisma.systemLog.findMany({
        where: departmentWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          message: true,
          department: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPipeline = marketingLeads + admissionLeads;
    const totalWon = wonLeads + enrolledStudents;

    return {
      todayChats,
      totalConversations,
      marketingLeads,
      admissionLeads,
      wonLeads,
      enrolledStudents,
      revenue: Number(wonValue?._sum.estimatedValue ?? 0),
      openTickets,
      upcomingMeetings,
      upcomingBatches,
      conversionRate: totalPipeline ? Math.round((totalWon / totalPipeline) * 100) : 0,
      satisfaction: Number(ratings._avg.rating ?? 0),
      popularServices: serviceGroups.map((g) => ({
        label: g.serviceSlug ?? "Unspecified",
        count: g._count._all,
      })),
      popularCourses: courseGroups.map((g) => ({
        label: g.courseName ?? "Unspecified",
        count: g._count._all,
      })),
      recentActivity,
    } satisfies DashboardStats;
  }, EMPTY_STATS);
}
