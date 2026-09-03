import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { safeQuery } from "@/lib/admin/queries";
import {
  Callout,
  DataTable,
  DbNotice,
  DepartmentTag,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { formatDateTime, humanise } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await requireAdmin("/admin/users");
  const unrestricted = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  const { data, error } = await safeQuery(
    () =>
      prisma.user.findMany({
        // Department-scoped admins only manage their own business's staff.
        where: unrestricted ? undefined : { department: session.department ?? undefined },
        orderBy: [{ role: "desc" }, { name: "asc" }],
        take: 200,
        include: { rbac: { select: { name: true } } },
      }),
    []
  );

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts, their access tier and which business they're scoped to."
      />

      {error && <DbNotice error={error} />}

      <Callout title="Department scoping is enforced everywhere">
        A user assigned to Cakestry Bakery cannot read or edit Cakestry Special Events records, and vice
        versa — the restriction is applied in the data layer, not just in the navigation. Leave
        the department blank only for staff who genuinely need both.
      </Callout>

      <div className="mt-6">
        <DataTable
          rows={data}
          rowKey={(row) => row.id}
          empty="No users yet. Run `npm run db:seed` to create the starting accounts."
          columns={[
            {
              header: "Name",
              cell: (row) => (
                <div className="min-w-0">
                  <p className="font-medium">{row.name}</p>
                  <p className="break-all text-xs text-muted-foreground">{row.email ?? "—"}</p>
                </div>
              ),
            },
            {
              header: "Access tier",
              cell: (row) => <StatusBadge value={row.role} />,
            },
            {
              header: "Role",
              cell: (row) => (
                <span className="text-xs text-muted-foreground">
                  {row.rbac?.name ?? "No role assigned"}
                </span>
              ),
            },
            {
              header: "Business",
              cell: (row) =>
                row.department ? (
                  <DepartmentTag department={row.department} />
                ) : (
                  <span className="text-xs text-muted-foreground">Both</span>
                ),
            },
            {
              header: "Contact",
              cell: (row) => (
                <span className="text-xs text-muted-foreground">{row.phone ?? "—"}</span>
              ),
            },
            {
              header: "Status",
              cell: (row) => <StatusBadge value={row.isActive ? "ACTIVE" : "INACTIVE"} />,
            },
            {
              header: "Last sign-in",
              cell: (row) => (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {row.lastLoginAt ? formatDateTime(row.lastLoginAt) : "Never"}
                </span>
              ),
            },
            {
              header: "Language",
              cell: (row) => (
                <span className="text-xs text-muted-foreground">{humanise(row.language)}</span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
