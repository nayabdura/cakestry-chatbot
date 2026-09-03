import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRANDING } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";

export const metadata: Metadata = {
  title: {
    default: `${BRANDING.product.name} · ${BRANDS.MARKETING.shortName}`,
    template: `%s · ${BRANDING.product.shortName}`,
  },
  description:
    "Official AI Customer Assistant for Cakestry Bakery Bahawal Nagar — Custom birthday cakes, wedding cakes, fresh pastries, dessert catering, and doorstep delivery in Bahawal Nagar.",
  applicationName: BRANDING.product.name,
  authors: [{ name: BRANDING.developer.name, url: BRANDING.developer.url }],
  keywords: [
    "Cakestry Bakery",
    "Cakestry Bahawal Nagar",
    "Bakery Bahawal Nagar",
    "Custom Cakes",
    "Birthday Cake",
    "Wedding Cake",
    "Fondant Cake",
    "Pastries",
    "Cake Delivery",
    "Bahawal Nagar",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: BRANDING.product.name,
    description: BRANDING.developer.tagline,
    siteName: BRANDING.product.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
