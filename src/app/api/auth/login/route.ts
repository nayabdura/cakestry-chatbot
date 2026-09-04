import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Enter a valid email and password." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const invalid = () =>
      new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

    if (!user || !user.passwordHash || !user.isActive) return invalid();
    if (!(await verifyPassword(password, user.passwordHash))) return invalid();

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      department: user.department,
    });

    const cookieHeader = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieHeader,
        },
      }
    );
  } catch (e) {
    console.error("[login] error:", e);
    return new Response(
      JSON.stringify({ error: "Sign-in is unavailable right now. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
