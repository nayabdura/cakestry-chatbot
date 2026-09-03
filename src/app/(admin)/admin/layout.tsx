import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/session";
import { loadPermissions, navCounts, sessionDepartment } from "@/lib/admin/queries";
import type { Department } from "@/lib/brands";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Cakestry Admin" },
  robots: { index: false, follow: false },
};

/** Admin pages read live data on every request. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate the whole console here so no page can be reached without a session.
  const session = await requireAdmin();

  const [permissions, badges] = await Promise.all([
    loadPermissions(session),
    navCounts(session),
  ]);

  const department = sessionDepartment(session);

  return (
    <AdminShell
      user={{
        name: session.name,
        role: session.role,
        department: department as Department | null,
      }}
      permissions={permissions ? [...permissions] : null}
      badges={badges}
    >
      {children}
    </AdminShell>
  );
}
