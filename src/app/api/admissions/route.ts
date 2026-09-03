import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateReference } from "@/lib/utils";
import { logEvent, notifyTeam } from "@/lib/notify";
import { clientIp, conversationIdFor, created, failed, invalid, throttle } from "@/lib/api";
import { findCourse } from "@/data/institute/courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cakestry Special Events — event catering inquiry.
 *
 * Collects the fields from the brief (student name, father name, phone,
 * WhatsApp, email, qualification, city, interested course, preferred batch),
 * generates an admission reference, stores it at stage INQUIRY in the
 * admissions pipeline and notifies the admissions team.
 */
const bodySchema = z.object({
  studentName: z.string().min(2).max(120),
  fatherName: z.string().max(120).optional(),
  phone: z.string().min(7).max(32),
  whatsapp: z.string().max(32).optional(),
  email: z.string().email().max(160).optional().or(z.literal("")),
  qualification: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  /** Course slug from the catalogue, or a free-text course name. */
  course: z.string().min(1).max(120),
  preferredBatch: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
  conversationRef: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await throttle(req, "admissions", 5, 600);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid();

  const data = parsed.data;
  const reference = generateReference("ADM", "INSTITUTE");
  const catalogueCourse = findCourse(data.course);

  try {
    // Link to the catalogue row when the course exists in the database; a
    // free-text course name is still captured so no inquiry is ever lost.
    const courseRecord = catalogueCourse
      ? await prisma.course
          .findUnique({ where: { slug: catalogueCourse.slug }, select: { id: true } })
          .catch(() => null)
      : null;

    const admission = await prisma.admission.create({
      data: {
        reference,
        studentName: data.studentName,
        fatherName: data.fatherName || null,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        qualification: data.qualification || null,
        city: data.city || null,
        courseId: courseRecord?.id ?? null,
        courseName: catalogueCourse?.name ?? data.course,
        preferredBatch: data.preferredBatch || null,
        notes: data.notes || null,
        source: "CHATBOT",
        stage: "INQUIRY",
        conversationId: await conversationIdFor(data.conversationRef),
      },
      select: { id: true },
    });

    await notifyTeam({
      department: "INSTITUTE",
      subject: `New admission inquiry ${reference} — ${data.studentName}`,
      body: [
        `Reference: ${reference}`,
        `Student: ${data.studentName}`,
        data.fatherName ? `Father: ${data.fatherName}` : null,
        `Phone: ${data.phone}`,
        data.whatsapp ? `WhatsApp: ${data.whatsapp}` : null,
        data.email ? `Email: ${data.email}` : null,
        data.qualification ? `Qualification: ${data.qualification}` : null,
        data.city ? `City: ${data.city}` : null,
        `Course: ${catalogueCourse?.name ?? data.course}`,
        data.preferredBatch ? `Preferred batch: ${data.preferredBatch}` : null,
        data.notes ? `\nNotes:\n${data.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      link: `/admin/crm/admissions/${admission.id}`,
    });

    await logEvent({
      action: "admission.created",
      department: "INSTITUTE",
      entity: "Admission",
      entityId: admission.id,
      message: `Admission inquiry ${reference} captured from the assistant.`,
      ipAddress: clientIp(req),
      metadata: { reference, course: catalogueCourse?.slug ?? data.course },
    });

    return created(
      reference,
      `Thank you, ${data.studentName.split(" ")[0]}! Your admission inquiry is registered as **${reference}**. An admission officer will call you on ${data.phone} to guide you through the next steps.`
    );
  } catch (error) {
    console.error("[admissions] create failed:", error);
    return failed();
  }
}
