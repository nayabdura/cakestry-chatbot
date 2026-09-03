import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { BRANDS } from "@/lib/brands";
import { generateReference } from "@/lib/utils";
import { logEvent, notifyTeam } from "@/lib/notify";
import { clientIp, conversationIdFor, created, failed, invalid, throttle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consultation / meeting booking — used by both businesses.
 *
 * Cakestry Bakery & Special Events — cake tasting / consultation booking.
 * counselling sessions and campus visits. The department decides which team is
 * notified and which reference prefix is issued.
 */
const bodySchema = z.object({
  department: z.enum(["MARKETING", "INSTITUTE"]),
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(32),
  email: z.string().email().max(160).optional().or(z.literal("")),
  businessName: z.string().max(160).optional(),
  /** ISO date (YYYY-MM-DD) selected by the visitor. */
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().min(3).max(40),
  mode: z.enum(["OFFICE", "ZOOM", "GOOGLE_MEET", "WHATSAPP"]),
  topic: z.string().max(500).optional(),
  conversationRef: z.string().max(64).optional(),
});

const MODE_LABEL: Record<string, string> = {
  OFFICE: "Office visit",
  ZOOM: "Zoom",
  GOOGLE_MEET: "Google Meet",
  WHATSAPP: "WhatsApp call",
};

export async function POST(req: NextRequest) {
  const limited = await throttle(req, "meetings", 5, 600);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid();

  const data = parsed.data;
  const department = data.department;
  const reference = generateReference("MTG", department);

  // Reject dates in the past — a booking for last Tuesday helps nobody.
  const date = new Date(`${data.preferredDate}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime()) || date < today) {
    return invalid("Please choose today or a future date for the meeting.");
  }

  try {
    const meeting = await prisma.meeting.create({
      data: {
        reference,
        department,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        businessName: data.businessName || null,
        topic: data.topic || null,
        mode: data.mode,
        status: "REQUESTED",
        preferredDate: date,
        preferredTime: data.preferredTime,
        conversationId: await conversationIdFor(data.conversationRef),
      },
      select: { id: true },
    });

    await notifyTeam({
      department,
      subject: `Meeting request ${reference} — ${data.name} (${data.preferredDate} ${data.preferredTime})`,
      body: [
        `Reference: ${reference}`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : null,
        data.businessName ? `Business: ${data.businessName}` : null,
        `Preferred: ${data.preferredDate} at ${data.preferredTime}`,
        `Mode: ${MODE_LABEL[data.mode]}`,
        data.topic ? `\nTopic:\n${data.topic}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      link: `/admin/meetings`,
    });

    await logEvent({
      action: "meeting.requested",
      department,
      entity: "Meeting",
      entityId: meeting.id,
      message: `Meeting ${reference} requested from the assistant.`,
      ipAddress: clientIp(req),
      metadata: { reference, mode: data.mode },
    });

    return created(
      reference,
      `Your meeting request **${reference}** is booked for **${data.preferredDate} at ${data.preferredTime}** via **${MODE_LABEL[data.mode]}**. Our team will confirm on ${data.phone}. If anything changes, call ${BRANDS[department].contact.phone}.`
    );
  } catch (error) {
    console.error("[meetings] create failed:", error);
    return failed();
  }
}
