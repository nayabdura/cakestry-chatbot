import { prisma } from "@/lib/db";
import { PRODUCTS, CATEGORIES } from "@/lib/cakestry";

export async function syncCakestryProductsToDb() {
  console.log("[sync] Syncing Cakestry Bakery products to database...");

  for (let i = 0; i < PRODUCTS.length; i++) {
    const prod = PRODUCTS[i];
    const cat = CATEGORIES.find((c) => c.id === prod.categoryId);
    const categoryName = cat ? cat.nameEn : prod.categoryId;

    await prisma.marketingService.upsert({
      where: { slug: prod.id },
      update: {
        name: prod.nameEn,
        group: categoryName,
        tagline: `${prod.nameUr} — Rs. ${prod.price.toLocaleString()} (${prod.unit})`,
        overview: `Freshly prepared ${prod.nameEn} at Cakestry Bakery Bahawal Nagar.`,
        priceFrom: `Rs. ${prod.price.toLocaleString()}`,
        priceModel: prod.unit,
        priceNote: prod.allowCheeseAddon ? "Extra Cheese Add-On available for Rs. 70" : "Standard price",
        isActive: true,
        sortOrder: i,
      },
      create: {
        slug: prod.id,
        name: prod.nameEn,
        group: categoryName,
        tagline: `${prod.nameUr} — Rs. ${prod.price.toLocaleString()} (${prod.unit})`,
        overview: `Freshly prepared ${prod.nameEn} at Cakestry Bakery Bahawal Nagar.`,
        benefits: ["Fresh Ingredients", "Handcrafted Daily", "Fast Local Delivery"],
        features: [prod.nameUr, `Rs. ${prod.price}`, prod.unit],
        process: ["Order Received", "Freshly Prepared", "Packed with Care", "Dispatched/Ready"],
        priceFrom: `Rs. ${prod.price.toLocaleString()}`,
        priceModel: prod.unit,
        priceNote: prod.allowCheeseAddon ? "Extra Cheese Add-On available for Rs. 70" : "Standard price",
        isActive: true,
        sortOrder: i,
      },
    });
  }

  console.log(`[sync] Successfully synced ${PRODUCTS.length} products to database.`);
}
