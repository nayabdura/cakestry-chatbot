import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth";
import { config } from "@/lib/config";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Please provide a valid name, email and an 8+ character password." },
      { status: 400 }
    );
  }
  const { name, email, password, phone } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash: await hashPassword(password) },
    });

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      department: user.department,
    });
    const res = Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.headers.append(
      "Set-Cookie",
      cookie(SESSION_COOKIE, token)
    );
    return res;
  } catch (e) {
    console.error("[register] error:", e);
    return Response.json(
      { error: "Registration is unavailable right now. Please try again later." },
      { status: 500 }
    );
  }
}

function cookie(name: string, value: string): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  return parts.join("; ");
}
