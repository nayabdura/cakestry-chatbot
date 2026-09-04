import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth";
import { config } from "@/lib/config";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Generic message avoids leaking which accounts exist.
    const invalid = () =>
      Response.json({ error: "Invalid email or password." }, { status: 401 });

    if (!user || !user.passwordHash || !user.isActive) return invalid();
    if (!(await verifyPassword(password, user.passwordHash))) return invalid();

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      department: user.department,
    });
    const res = Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
    res.headers.append("Set-Cookie", cookie(SESSION_COOKIE, token));
    return res;
  } catch (e) {
    console.error("[login] error:", e);
    return Response.json(
      { error: "Sign-in is unavailable right now. Please try again later." },
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
