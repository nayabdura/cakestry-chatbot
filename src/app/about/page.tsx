import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Bot,
  Cake,
  Gift,
  Globe,
  Languages,
  Lock,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/branding/Footer";
import { CakestryBranding } from "@/components/branding/CakestryBranding";
import { BRANDING, brandName, brandUrl, brandTagline } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";

export const metadata: Metadata = {
  title: "About",
  description:
    "About the Cakestry AI Assistant — official customer assistant for Cakestry Bakery & Special Events Bahawal Nagar.",
};

const FEATURES = [
  {
    icon: Workflow,
    title: "Intelligent routing",
    desc: "Helps you choose between Bakery Cake Orders or Special Event Catering & Gift Boxes.",
  },
  {
    icon: Languages,
    title: "Four languages",
    desc: "English, Urdu, Roman Urdu and Punjabi — with tolerance for spelling mistakes, cake flavor requests and Urdu text.",
  },
  {
    icon: Sparkles,
    title: "Grounded answers",
    desc: "Replies come from Cakestry Bakery's official product list, cake prices, and delivery terms in Bahawal Nagar.",
  },
  {
    icon: Globe,
    title: "24/7 order capture",
    desc: "Cake orders, custom requests, and event inquiries logged anytime with immediate reference IDs.",
  },
  {
    icon: Bot,
    title: "Actions & Workflows",
    desc: "Custom cake quotes, tasting bookings, and support tickets created and sent directly to the bakery team.",
  },
  {
    icon: Lock,
    title: "Secure by design",
    desc: "Rate limiting, JWT sessions, role-based access, input validation and full audit logging across every module.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="glass sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-white">
              <Cake className="size-5" />
            </span>
            <span className="text-sm font-bold">{BRANDING.product.name}</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" /> Home
            </Button>
          </Link>
        </div>
      </header>

      <section className="container max-w-3xl py-16">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          About {BRANDING.product.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {BRANDING.product.description} Servicing Model Town and all areas across Bahawal Nagar with custom cakes, birthday specials, wedding cakes, and event catering.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[BRANDS.MARKETING, BRANDS.INSTITUTE].map((brand) => (
            <Card key={brand.id} data-department={brand.id} className="p-5">
              <span className="mb-3 inline-grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
                {brand.id === "MARKETING" ? (
                  <Cake className="size-5" />
                ) : (
                  <Gift className="size-5" />
                )}
              </span>
              <h3 className="font-semibold">
                {brand.emoji} {brand.shortName}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{brand.description}</p>
              <p className="mt-3 text-xs font-medium text-orange-700">
                {brand.purpose.join(" · ")}
              </p>
            </Card>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-bold tracking-tight">What it does</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-5">
              <span className="mb-3 inline-grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
                <feature.icon className="size-5" />
              </span>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-orange-700 to-amber-800 mt-12 border-0 p-8 text-white">
          <h2 className="text-xl font-bold">{BRANDING.product.poweredBy}</h2>
          <p className="mt-2 text-white/80">{brandTagline}</p>
          <div className="mt-5">
            <p className="text-sm text-white/70">Designed &amp; Developed for</p>
            <Link
              href={brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-white hover:underline"
            >
              {brandName}
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/chat">
              <Button className="gap-2 bg-white text-orange-800 hover:bg-white/90">
                <Sparkles className="size-4" /> Try Order Assistant
              </Button>
            </Link>
          </div>
        </Card>

        <div className="mt-10 flex justify-center">
          <CakestryBranding />
        </div>
      </section>

      <Footer />
    </main>
  );
}
