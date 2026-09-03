import Link from "next/link";
import { notFound } from "next/navigation";
import type { AdmissionStage, LeadSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { safeQuery, sessionDepartment } from "@/lib/admin/queries";
import {
  DataTable,
  DbNotice,
  FilterChip,
  PageHeader,
  SourceBadge,
  StatusBadge,
} from "@/components/admin/ui";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { formatDate, humanise } from "@/lib/utils";

export const metadata = { title: "Event Inquiries" };

const STAGES: AdmissionStage[] = [
  "INQUIRY", "CONTACTED", "COUNSELLED", "APPLIED",
  "FEE_PENDING", "ENROLLED", "DROPPED", "LOST",
];

const SOURCES: LeadSource[] = [
  "CHATBOT", "WHATSAPP", "WEBSITE", "REFERRAL", "WALK_IN", "SOCIAL", "PHONE", "OTHER",
];

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; source?: string }>;
}) {
  const session = await requireAdmin("/admin/crm/admissions");
  // Marketing-scoped staff have no business in the admissions pipeline.
  if (sessionDepartment(session) === "MARKETING") notFound();

  const { stage, source } = await searchParams;
  const active = STAGES.includes(stage as AdmissionStage)
    ? (stage as AdmissionStage)
    : undefined;
  const activeSource = SOURCES.includes(source as LeadSource)
    ? (source as LeadSource)
    : undefined;

  const where: Prisma.AdmissionWhereInput = {
    ...(active ? { stage: active } : {}),
    ...(activeSource ? { source: activeSource } : {}),
  };

  const { data, error } = await safeQuery(
    async () => {
      const [admissions, stageCounts, sourceCounts] = await Promise.all([
        prisma.admission.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            owner: { select: { name: true } },
            course: { select: { name: true } },
          },
        }),
        prisma.admission.groupBy({
          by: ["stage"],
          _count: { _all: true },
          where: activeSource ? { source: activeSource } : undefined,
        }),
        prisma.admission.groupBy({
          by: ["source"],
          _count: { _all: true },
          where: active ? { stage: active } : undefined,
        }),
      ]);
      return { admissions, stageCounts, sourceCounts };
    },
    {
      admissions: [],
      stageCounts: [] as Array<{ stage: AdmissionStage; _count: { _all: number } }>,
      sourceCounts: [] as Array<{ source: LeadSource; _count: { _all: number } }>,
    }
  );

  const countForStage = (value: AdmissionStage) =>
    data.stageCounts.find((c) => c.stage === value)?._count._all ?? 0;
  const countForSource = (value: LeadSource) =>
    data.sourceCounts.find((c) => c.source === value)?._count._all ?? 0;
  const total = data.stageCounts.reduce((sum, c) => sum + c._count._all, 0);
  const sourceTotal = data.sourceCounts.reduce((sum, c) => sum + c._count._all, 0);

  const url = (next: { stage?: AdmissionStage; source?: LeadSource }) => {
    const params = new URLSearchParams();
    const nextStage = "stage" in next ? next.stage : active;
    const nextSource = "source" in next ? next.source : activeSource;
    if (nextStage) params.set("stage", nextStage);
    if (nextSource) params.set("source", nextSource);
    const query = params.toString();
    return query ? `/admin/crm/admissions?${query}` : "/admin/crm/admissions";
  };

  return (
    <>
      <PageHeader
        title="Event Inquiries"
        department="INSTITUTE"
        description="Every prospective event booking captured by the assistant, WhatsApp, walk-ins and referrals — managed through the Cakestry Special Events pipeline."
      />

      {error && <DbNotice error={error} />}

      <div className="scroll-slim mb-3 flex gap-2 overflow-x-auto pb-1">
        <FilterChip href={url({ stage: undefined })} label="All stages" count={total} active={!active} />
        {STAGES.map((value) => (
          <FilterChip
            key={value}
            href={url({ stage: value })}
            label={humanise(value)}
            count={countForStage(value)}
            active={active === value}
          />
        ))}
      </div>

      <div className="scroll-slim mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          href={url({ source: undefined })}
          label="All sources"
          count={sourceTotal}
          active={!activeSource}
        />
        {SOURCES.filter((value) => countForSource(value) > 0 || activeSource === value).map(
          (value) => (
            <FilterChip
              key={value}
              href={url({ source: value })}
              label={value === "WHATSAPP" ? "🟢 WhatsApp" : humanise(value)}
              count={countForSource(value)}
              active={activeSource === value}
            />
          )
        )}
      </div>

      <DataTable
        rows={data.admissions}
        rowKey={(row) => row.id}
        empty="No admission inquiries match this filter yet."
        columns={[
          {
            header: "Reference",
            cell: (row) => (
              <Link
                href={`/admin/crm/admissions/${row.id}`}
                className="font-mono text-xs font-medium text-primary hover:underline"
              >
                {row.reference}
              </Link>
            ),
          },
          {
            header: "Student",
            cell: (row) => (
              <div className="min-w-0">
                <p className="font-medium">{row.studentName}</p>
                {row.fatherName && (
                  <p className="text-xs text-muted-foreground">s/o {row.fatherName}</p>
                )}
                <a
                  href={`https://wa.me/${(row.whatsapp ?? row.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  {row.phone}
                </a>
              </div>
            ),
          },
          {
            header: "Course",
            cell: (row) => (
              <div className="min-w-0 text-xs">
                <p className="font-medium">{row.course?.name ?? row.courseName ?? "—"}</p>
                <p className="text-muted-foreground">{row.preferredBatch ?? "No batch preference"}</p>
              </div>
            ),
          },
          {
            header: "Source",
            cell: (row) => <SourceBadge value={row.source} />,
          },
          {
            header: "Background",
            cell: (row) => (
              <div className="text-xs text-muted-foreground">
                <p>{row.qualification ?? "—"}</p>
                <p>{row.city ?? "—"}</p>
              </div>
            ),
          },
          {
            header: "Stage",
            cell: (row) => (
              <StatusSelect
                entity="admissions"
                id={row.id}
                field="stage"
                value={row.stage}
                options={STAGES}
              />
            ),
          },
          { header: "Priority", cell: (row) => <StatusBadge value={row.priority} /> },
          {
            header: "Officer",
            cell: (row) => (
              <span className="text-xs text-muted-foreground">
                {row.owner?.name ?? "Unassigned"}
              </span>
            ),
          },
          {
            header: "Created",
            cell: (row) => (
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.createdAt)}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
