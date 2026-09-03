import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Cake,
  Gift,
  Languages,
  MessagesSquare,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { SplashScreen } from "@/components/splash/SplashScreen";
import { Footer } from "@/components/branding/Footer";
import { CakestryBranding } from "@/components/branding/CakestryBranding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BRANDING } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";
import { MARKETING_SERVICES } from "@/data/marketing/services";
import { INSTITUTE_COURSES } from "@/data/institute/courses";

const CAPABILITIES = [
  {
    icon: Workflow,
    title: "Instant Cake & Event Guidance",
    body: "The assistant helps you choose custom cakes or event catering packages tailored to your budget and guest count.",
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    body: "English, Urdu, Roman Urdu and Punjabi — order your cake in whichever language you feel most comfortable.",
  },
  {
    icon: MessagesSquare,
    title: "Instant Order & Booking Capture",
    body: "Place a custom cake order, book an event tasting session, or submit a support inquiry with an instant reference ID.",
  },
  {
    icon: ShieldCheck,
    title: "Official Bakery Information",
    body: "Every response is grounded in Cakestry Bakery's official products, flavor lists, pricing, and delivery areas.",
  },
];

export default function HomePage() {
  return (
    <>
      <SplashScreen />

      <main className="flex min-h-dvh flex-col">
        {/* Header */}
        <header className="glass sticky top-0 z-40">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                <Cake className="size-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-sm font-bold">{BRANDING.product.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {BRANDS.MARKETING.shortName} · {BRANDS.INSTITUTE.shortName}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Staff Sign in
                </Button>
              </Link>
              <Link href="/chat">
                <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
                  Order Now <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-r from-orange-700 via-orange-800 to-amber-900 relative overflow-hidden text-white">
          <div className="container grid gap-10 py-20 md:grid-cols-2 md:py-28">
            <div className="flex flex-col justify-center gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
                <span className="size-2 animate-pulse rounded-full bg-white/80" />
                Bahawal Nagar · {BRANDING.product.poweredBy}
              </span>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Delicious Custom Cakes.
                <br />
                <span className="text-white/80">Crafted with Love.</span>
              </h1>
              <p className="max-w-md text-white/80">
                Order custom birthday cakes, wedding cakes, pastries, and party dessert tables from{" "}
                <strong className="font-semibold text-white">Cakestry Bakery Bahawal Nagar</strong>.
                Fast local delivery in Model Town and across Bahawal Nagar!
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/chat">
                  <Button
                    size="lg"
                    className="gap-2 bg-white text-orange-800 hover:bg-white/90"
                  >
                    <MessagesSquare className="size-5" /> Start Order Chat
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                  >
                    About Us
                  </Button>
                </Link>
              </div>
            </div>

            {/* Preview card */}
            <div className="flex items-center justify-center">
              <Card className="glass w-full max-w-sm border-white/20 p-5 text-foreground">
                <div className="flex items-center gap-2 border-b pb-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-orange-600 text-white">
                    <Bot className="size-4" />
                  </span>
                  <span className="text-sm font-semibold">
                    {BRANDING.product.shortName}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-500" /> online
                  </span>
                </div>
                <div className="space-y-3 py-4 text-sm">
                  <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-secondary px-3 py-2">
                    👋 Welcome to Cakestry Bakery! How can I help with your cake order today?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border bg-background px-3 py-1 text-xs">
                      🎂 Custom Bakery Cakes
                    </span>
                    <span className="rounded-full border bg-background px-3 py-1 text-xs">
                      🧁 Special Events & Gift Boxes
                    </span>
                  </div>
                  <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-orange-600 px-3 py-2 text-white">
                    Mujhe 2 pound chocolate fudge birthday cake order karna hai
                  </p>
                  <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-secondary px-3 py-2">
                    Cakestry 2-Pound Chocolate Fudge Cake PKR 2,500 se shuru hota hai. Name text aur delivery address bataen…
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* The two divisions */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Our Bakery Services</h2>
            <p className="mt-3 text-muted-foreground">
              Select what you need or let our AI assistant guide you to the perfect order.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BusinessCard
              department="MARKETING"
              icon={Cake}
              items={MARKETING_SERVICES.map((s) => s.name)}
              footer={`${MARKETING_SERVICES.length} items`}
            />
            <BusinessCard
              department="INSTITUTE"
              icon={Gift}
              items={INSTITUTE_COURSES.map((c) => c.name)}
              footer={`${INSTITUTE_COURSES.length} packages`}
            />
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-y bg-secondary/40 py-16 md:py-20">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Designed for Easy Ordering
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((capability) => (
                <Card key={capability.title} className="animate-fade-in-up p-5">
                  <span className="mb-4 inline-grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
                    <capability.icon className="size-5" />
                  </span>
                  <h3 className="text-sm font-semibold">{capability.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {capability.body}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 md:py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Order Fresh Cakes Anytime in Bahawal Nagar
            </h2>
            <Link href="/chat">
              <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                Order Online Now <ArrowRight className="size-5" />
              </Button>
            </Link>
            <CakestryBranding />
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

function BusinessCard({
  department,
  icon: Icon,
  items,
  footer,
}: {
  department: "MARKETING" | "INSTITUTE";
  icon: typeof Cake;
  items: string[];
  footer: string;
}) {
  const brand = BRANDS[department];

  return (
    <Card
      data-department={department}
      className="flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-glow"
    >
      <div className="bg-gradient-to-r from-orange-600 to-amber-700 p-6 text-white">
        <span className="mb-3 inline-grid size-12 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <Icon className="size-6" />
        </span>
        <h3 className="text-xl font-bold">
          {brand.emoji} {brand.shortName}
        </h3>
        <p className="mt-1 text-sm text-white/80">{brand.tagline}</p>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{brand.description}</p>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground"
            >
              {item}
            </li>
          ))}
          <li className="rounded-full border border-dashed px-2.5 py-1 text-[11px] text-muted-foreground">
            {footer}
          </li>
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3 border-t pt-5">
          <div className="text-[11px] text-muted-foreground">
            <p>{brand.contact.phone}</p>
            <p className="break-all">{brand.contact.email}</p>
          </div>
          <Link href="/chat">
            <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
              Order Chat <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
