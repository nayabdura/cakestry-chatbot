import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { safeQuery, sessionDepartment } from "@/lib/admin/queries";
import { Callout, DbNotice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { INSTITUTE_COURSES } from "@/data/institute/courses";

export const metadata = { title: "Event Packages" };

export default async function CoursesPage() {
  const session = await requireAdmin("/admin/catalogue/courses");
  if (sessionDepartment(session) === "MARKETING") notFound();

  const { data: stored, error } = await safeQuery(
    () =>
      prisma.course.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          faculty: { select: { name: true } },
          _count: { select: { batches: true, admissions: true } },
        },
      }),
    []
  );

  const courses = stored.length
    ? stored.map((course) => ({
        slug: course.slug,
        name: course.name,
        group: course.group,
        tagline: course.tagline,
        duration: course.duration,
        fee: course.feeFrom ?? "—",
        modules: course.curriculum.length,
        trainer: course.faculty?.name ?? "Unassigned",
        batches: course._count.batches,
        inquiries: course._count.admissions,
        isActive: course.isActive,
      }))
    : INSTITUTE_COURSES.map((course) => ({
        slug: course.slug,
        name: course.name,
        group: course.group,
        tagline: course.tagline,
        duration: course.duration,
        fee: course.fee.startingAt,
        modules: course.curriculum.length,
        trainer: course.trainer,
        batches: 0,
        inquiries: 0,
        isActive: true,
      }));

  const groups = Array.from(new Set(courses.map((c) => c.group)));

  return (
    <>
      <PageHeader
        title="Event Packages"
        department="INSTITUTE"
        description="The Cakestry Special Events package catalogue the assistant answers from — included items, guest count, and pricing."
      />

      {error && <DbNotice error={error} />}

      <Callout title="Fees are placeholders">
        Every fee shown is indicative. The assistant always states that the final fee, discounts
        and scholarship eligibility are confirmed by the admissions office. Update these once the
        fee structure is signed off.
      </Callout>

      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {courses
                .filter((course) => course.group === group)
                .map((course) => (
                  <Card key={course.slug} data-department="INSTITUTE" className="flex flex-col p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{course.name}</h3>
                      <StatusBadge value={course.isActive ? "PUBLISHED" : "ARCHIVED"} />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {course.tagline}
                    </p>

                    <dl className="mt-3 space-y-1 text-[11px]">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Fee from</dt>
                        <dd className="font-medium">{course.fee}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Duration</dt>
                        <dd className="text-right">{course.duration}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Trainer</dt>
                        <dd className="text-right">{course.trainer}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Curriculum</dt>
                        <dd>{course.modules} modules</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Demand</dt>
                        <dd>
                          {course.batches} batches · {course.inquiries} inquiries
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-3 border-t pt-2 font-mono text-[10px] text-muted-foreground">
                      {course.slug}
                    </p>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
