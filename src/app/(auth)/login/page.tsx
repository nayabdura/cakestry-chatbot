"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Cake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CakestryBranding } from "@/components/branding/CakestryBranding";
import { BRANDING } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";

const STAFF_ROLES = ["AGENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email: form.get("email"), password: form.get("password") }
        : {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            phone: form.get("phone") || undefined,
          };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");

      const next = new URLSearchParams(window.location.search).get("next");
      const role: string | undefined = data?.user?.role;
      const target = next ?? (role && STAFF_ROLES.includes(role) ? "/admin" : "/chat");
      window.location.href = target;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-orange-700 via-orange-800 to-amber-900 grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center text-white">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur">
            <Cake className="size-7 text-white" />
          </span>
          <div>
            <h1 className="text-xl font-bold">{BRANDING.product.name}</h1>
            <p className="text-sm text-white/75">
              {BRANDS.MARKETING.shortName} · {BRANDS.INSTITUTE.shortName}
            </p>
          </div>
        </div>

        <Card className="glass border-white/20">
          <CardHeader className="pb-2">
            <div className="flex rounded-xl bg-secondary p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              {mode === "register" && (
                <>
                  <Input
                    name="name"
                    placeholder="Full name"
                    autoComplete="name"
                    required
                    minLength={2}
                  />
                  <Input name="phone" placeholder="Phone (optional)" autoComplete="tel" />
                </>
              )}
              <Input
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
              />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "register" ? 8 : 1}
              />

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              No account needed to chat —{" "}
              <Link href="/chat" className="font-medium text-primary hover:underline">
                open the assistant
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <CakestryBranding
            className="text-white/70 [&_a]:text-white [&_a:hover]:text-white"
            variant="stacked"
          />
        </div>
      </div>
    </div>
  );
}
