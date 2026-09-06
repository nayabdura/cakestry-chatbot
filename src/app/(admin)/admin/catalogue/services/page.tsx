import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { safeQuery, sessionDepartment } from "@/lib/admin/queries";
import { Callout, DbNotice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { PRODUCTS, CATEGORIES } from "@/lib/cakestry";
import { syncCakestryProductsToDb } from "@/lib/sync-cakestry-products";

export const metadata = { title: "Bakery Products" };

export default async function ServicesPage() {
  const session = await requireAdmin("/admin/catalogue/services");
  if (sessionDepartment(session) === "INSTITUTE") notFound();

  // Sync latest catalogue products into DB on render if DB is missing items
  await safeQuery(() => syncCakestryProductsToDb(), null);

  const { data: stored, error } = await safeQuery(
    () => prisma.marketingService.findMany({ orderBy: { sortOrder: "asc" } }),
    []
  );

  const services = stored.length
    ? stored.map((service) => ({
        slug: service.slug,
        name: service.name,
        group: service.group,
        tagline: service.tagline,
        priceFrom: service.priceFrom ?? "—",
        priceModel: service.priceModel ?? "—",
        priceNote: service.priceNote ?? "",
        isActive: service.isActive,
      }))
    : PRODUCTS.map((p) => {
        const cat = CATEGORIES.find((c) => c.id === p.categoryId);
        return {
          slug: p.id,
          name: p.nameEn,
          group: cat ? cat.nameEn : p.categoryId,
          tagline: `${p.nameUr} — Rs. ${p.price.toLocaleString()} (${p.unit})`,
          priceFrom: `Rs. ${p.price.toLocaleString()}`,
          priceModel: p.unit,
          priceNote: p.allowCheeseAddon ? "Cheese Add-On available" : "Standard price",
          isActive: true,
        };
      });

  const groups = Array.from(new Set(services.map((s) => s.group)));

  return (
    <>
      <PageHeader
        title="Cakestry Bakery Catalogue"
        department="MARKETING"
        description="Official list of signature cakes, cupcakes, brownies, pastries, wraps and desserts for Cakestry Bakery Bahawal Nagar."
      />

      {error && <DbNotice error={error} />}

      <Callout title="Single Source of Truth Catalogue">
        All product names, prices and categories listed below are active in real-time across WhatsApp and Web AI Chatbot.
      </Callout>

      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group} ({services.filter((s) => s.group === group).length} Items)
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {services
                .filter((service) => service.group === group)
                .map((service) => (
                  <Card key={service.slug} data-department="MARKETING" className="flex flex-col p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{service.name}</h3>
                      <StatusBadge value={service.isActive ? "PUBLISHED" : "ARCHIVED"} />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {service.tagline}
                    </p>

                    <dl className="mt-3 space-y-1 text-[11px]">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Price</dt>
                        <dd className="font-medium text-emerald-600 dark:text-emerald-400">{service.priceFrom}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Unit</dt>
                        <dd className="text-right">{service.priceModel}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Note</dt>
                        <dd className="text-right text-muted-foreground">{service.priceNote}</dd>
                      </div>
                    </dl>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
