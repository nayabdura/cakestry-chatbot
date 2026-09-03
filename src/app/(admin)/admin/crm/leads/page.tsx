import Link from "next/link";
import type { LeadSource, LeadStage, Prisma } from "@prisma/client";
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
import { findService } from "@/data/marketing/services";
import { formatDate, humanise, truncate } from "@/lib/utils";
import { notFound } from "next/navigation";

export const metadata = { title: "Cake Orders" };

const STAGES: LeadStage[] = [
  "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST",
];

const SOURCES: LeadSource[] = [
  "CHATBOT", "WHATSAPP", "WEBSITE", "REFERRAL", "WALK_IN", "SOCIAL", "PHONE", "OTHER",
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; source?: string }>;
}) {
  const session = await requireAdmin("/admin/crm/leads");
  // Institute-scoped staff have no business in the sales pipeline.
  if (sessionDepartment(session) === "INSTITUTE") notFound();

  const { stage, source } = await searchParams;
  const active = STAGES.includes(stage as LeadStage) ? (stage as LeadStage) : undefined;
  const activeSource = SOURCES.includes(source as LeadSource)
    ? (source as LeadSource)
    : undefined;

  const where: Prisma.MarketingLeadWhereInput = {
    ...(active ? { stage: active } : {}),
    ...(activeSource ? { source: activeSource } : {}),
  };

  const { data, error } = await safeQuery(
    async () => {
      const [leads, stageCounts, sourceCounts] = await Promise.all([
        prisma.marketingLead.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { owner: { select: { name: true } } },
        }),
        prisma.marketingLead.groupBy({
          by: ["stage"],
          _count: { _all: true },
          where: activeSource ? { source: activeSource } : undefined,
        }),
        prisma.marketingLead.groupBy({
          by: ["source"],
          _count: { _all: true },
          where: active ? { stage: active } : undefined,
        }),
      ]);
      return { leads, stageCounts, sourceCounts };
    },
    {
      leads: [],
      stageCounts: [] as Array<{ stage: LeadStage; _count: { _all: number } }>,
      sourceCounts: [] as Array<{ source: LeadSource; _count: { _all: number } }>,
    }
  );

  const countForStage = (value: LeadStage) =>
    data.stageCounts.find((c) => c.stage === value)?._count._all ?? 0;
  const countForSource = (value: LeadSource) =>
    data.sourceCounts.find((c) => c.source === value)?._count._all ?? 0;
  const total = data.stageCounts.reduce((sum, c) => sum + c._count._all, 0);
  const sourceTotal = data.sourceCounts.reduce((sum, c) => sum + c._count._all, 0);

  const url = (next: { stage?: LeadStage; source?: LeadSource }) => {
    const params = new URLSearchParams();
    const nextStage = "stage" in next ? next.stage : active;
    const nextSource = "source" in next ? next.source : activeSource;
    if (nextStage) params.set("stage", nextStage);
    if (nextSource) params.set("source", nextSource);
    const query = params.toString();
    return query ? `/admin/crm/leads?${query}` : "/admin/crm/leads";
  };

  return (
    <>
      <PageHeader
        title="Cake Orders"
        department="MARKETING"
        description="Every cake order enquiry captured by the assistant, WhatsApp, the website and your team — managed through the Cakestry Bakery pipeline."
      />

      {error && <DbNotice error={error} />}

      {/* Pipeline filter */}
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

      {/* Channel filter — how much of the pipeline each source is producing */}
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
        rows={data.leads}
        rowKey={(row) => row.id}
        empty="No leads match this filter yet."
        columns={[
          {
            header: "Reference",
            cell: (row) => (
              <Link
                href={`/admin/crm/leads/${row.id}`}
                className="font-mono text-xs font-medium text-primary hover:underline"
              >
                {row.reference}
              </Link>
            ),
          },
          {
            header: "Contact",
            cell: (row) => (
              <div className="min-w-0">
                <p className="font-medium">{row.name}</p>
                {row.company && (
                  <p className="text-xs text-muted-foreground">{row.company}</p>
                )}
                <a
                  href={`https://wa.me/${row.phone.replace(/\D/g, "")}`}
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
            header: "Requirement",
            cell: (row) => (
              <div className="min-w-0 max-w-xs">
                <p className="text-xs font-medium">
                  {row.serviceSlug
                    ? findService(row.serviceSlug)?.name ?? humanise(row.serviceSlug)
                    : "Unspecified"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {truncate(row.requirements, 90)}
                </p>
              </div>
            ),
          },
          {
            header: "Source",
            cell: (row) => <SourceBadge value={row.source} />,
          },
          {
            header: "Budget",
            cell: (row) => (
              <div className="text-xs">
                <p>{row.budget ?? "—"}</p>
                <p className="text-muted-foreground">{row.timeline ?? "—"}</p>
              </div>
            ),
          },
          {
            header: "Stage",
            cell: (row) => (
              <StatusSelect entity="leads" id={row.id} field="stage" value={row.stage} options={STAGES} />
            ),
          },
          {
            header: "Priority",
            cell: (row) => <StatusBadge value={row.priority} />,
          },
          {
            header: "Owner",
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
