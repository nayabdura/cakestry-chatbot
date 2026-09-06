import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";
import { sendText } from "@/lib/whatsapp/client";

export interface DailyBakeryReportData {
  summaryId: string;
  businessDate: string;
  dateStr: string;
  totalOrders: number;
  grossSales: number;
  discountTotal: number;
  netSales: number;
  paidSales: number;
  pendingSales: number;
  cancelledOrders: number;
  completedOrders: number;
  deliveryOrders: number;
  pickupOrders: number;
  uniqueCustomers: number;
  itemsSold: number;
  orders: Array<{
    id: string;
    reference: string;
    customerName: string;
    phone: string;
    amount: number;
    stage: string;
    requirements: string;
    createdAt: Date;
  }>;
}

/**
 * Generate or retrieve an official DailySummary snapshot for Asia/Karachi (11:00 PM PKT).
 */
export async function generateDailyBakeryReport(date?: Date): Promise<DailyBakeryReportData> {
  const now = date || new Date();

  // Format date in Asia/Karachi (PKT)
  const pktDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }); // "YYYY-MM-DD"
  const summaryId = `DAILY-${pktDateStr}-2300`;

  // Start (00:00:00+05:00) and End (23:59:59+05:00) of PKT day
  const periodStart = new Date(`${pktDateStr}T00:00:00+05:00`);
  const periodEnd = new Date(`${pktDateStr}T23:59:59+05:00`);

  // Query all production orders created during this PKT business day
  const leads = await prisma.marketingLead.findMany({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let totalOrders = leads.length;
  let grossSales = 0;
  let discountTotal = 0;
  let netSales = 0;
  let paidSales = 0;
  let pendingSales = 0;
  let cancelledOrders = 0;
  let completedOrders = 0;
  let deliveryOrders = 0;
  let pickupOrders = 0;
  let itemsSold = 0;

  const phoneSet = new Set<string>();

  const orders = leads.map((l) => {
    const amount = Number(l.estimatedValue || 0);
    if (l.phone) phoneSet.add(l.phone.replace(/[^0-9]/g, ""));

    if (l.stage === "LOST") {
      cancelledOrders++;
    } else {
      grossSales += amount;
      netSales += amount;
      if (l.stage === "WON" || l.stage === "QUALIFIED") {
        paidSales += amount;
        completedOrders++;
      } else {
        pendingSales += amount;
      }
    }

    const isPickup = l.requirements?.toLowerCase().includes("pickup");
    if (isPickup) pickupOrders++;
    else deliveryOrders++;

    // Estimate items count from requirements text lines
    const itemLines = l.requirements?.split("\n").filter((line) => line.trim().startsWith("-") || line.trim().startsWith("•")) || [];
    itemsSold += Math.max(1, itemLines.length);

    return {
      id: l.id,
      reference: l.reference,
      customerName: l.name,
      phone: l.phone,
      amount,
      stage: l.stage,
      requirements: l.requirements,
      createdAt: l.createdAt,
    };
  });

  const displayDate = now.toLocaleDateString("en-PK", {
    timeZone: "Asia/Karachi",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reportData: DailyBakeryReportData = {
    summaryId,
    businessDate: pktDateStr,
    dateStr: displayDate,
    totalOrders,
    grossSales,
    discountTotal,
    netSales,
    paidSales,
    pendingSales,
    cancelledOrders,
    completedOrders,
    deliveryOrders,
    pickupOrders,
    uniqueCustomers: phoneSet.size,
    itemsSold,
    orders,
  };

  // Persist snapshot to DailySummary database table idempotently
  await prisma.dailySummary.upsert({
    where: { summaryId },
    update: {
      totalOrders,
      grossSales,
      discountTotal,
      netSales,
      paidSales,
      pendingSales,
      cancelledOrders,
      completedOrders,
      deliveryOrders,
      pickupOrders,
      uniqueCustomers: phoneSet.size,
      itemsSold,
      orderDetails: orders as any,
      generatedAt: new Date(),
    },
    create: {
      summaryId,
      summaryType: "BUSINESS_DAY",
      businessDate: pktDateStr,
      periodStart,
      periodEnd,
      timezone: "Asia/Karachi",
      totalOrders,
      grossSales,
      discountTotal,
      netSales,
      paidSales,
      pendingSales,
      cancelledOrders,
      completedOrders,
      deliveryOrders,
      pickupOrders,
      uniqueCustomers: phoneSet.size,
      itemsSold,
      orderDetails: orders as any,
      generatedAt: new Date(),
    },
  }).catch((err) => console.warn("[report] DailySummary DB save error:", err));

  // Upsert analytics_daily table as well
  const analyticsDate = new Date(`${pktDateStr}T00:00:00.000Z`);
  await prisma.analyticsDaily.upsert({
    where: {
      date_department: {
        date: analyticsDate,
        department: "MARKETING",
      },
    },
    update: {
      leads: totalOrders,
      revenue: netSales,
    },
    create: {
      date: analyticsDate,
      department: "MARKETING",
      leads: totalOrders,
      revenue: netSales,
    },
  }).catch(() => {});

  return reportData;
}

export async function sendDailyBakeryReportToOwner(): Promise<{ success: boolean; reportText: string }> {
  const data = await generateDailyBakeryReport();

  let text = `📊 *CAKESTRY BAKERY — DAILY 11:00 PM PKT SUMMARY REPORT*\n`;
  text += `🆔 *Summary ID:* ${data.summaryId}\n`;
  text += `📅 *Date:* ${data.dateStr}\n\n`;
  text += `📦 *Total Orders:* ${data.totalOrders}\n`;
  text += `✅ *Paid / Verified Sales:* Rs. ${data.paidSales.toLocaleString()}\n`;
  text += `⏳ *Pending Payment:* Rs. ${data.pendingSales.toLocaleString()}\n`;
  text += `❌ *Cancelled Orders:* ${data.cancelledOrders}\n`;
  text += `🚚 *Delivery / Pickup:* ${data.deliveryOrders} Delivery / ${data.pickupOrders} Pickup\n`;
  text += `👤 *Unique Customers:* ${data.uniqueCustomers}\n`;
  text += `💰 *TOTAL NET SALES: Rs. ${data.netSales.toLocaleString()}*\n`;
  text += `=====================================\n\n`;

  text += `📋 *ALL ORDER DETAILS TODAY:*\n`;
  if (data.orders.length === 0) {
    text += `_No orders recorded today across any customer numbers._\n`;
  } else {
    data.orders.forEach((o, idx) => {
      text += `\n*Order #${idx + 1}: Ref ${o.reference}*\n`;
      text += `👤 *Customer Name:* ${o.customerName}\n`;
      text += `📞 *Phone:* ${o.phone}\n`;
      text += `💰 *Amount:* Rs. ${o.amount.toLocaleString()}\n`;
      text += `📌 *Status:* ${o.stage}\n`;
      if (o.requirements) {
        text += `📝 *Items & Details:*\n${o.requirements.replace(/^/gm, "   ")}\n`;
      }
      text += `-------------------------------------\n`;
    });
  }

  text += `\n✨ Automated Daily Summary generated at 11:00 PM PKT.`;

  // Send WhatsApp report to Bakery Owner (0329-3110006)
  const ownerWaId = "923293110006";
  await sendText(ownerWaId, text).catch((e) => console.warn("[report] WhatsApp report failed:", e));

  // Send Email report to Bakery Owner
  await notifyTeam({
    department: "MARKETING",
    subject: `📊 DAILY SUMMARY ${data.summaryId} (${data.dateStr}) — Sales: Rs. ${data.netSales.toLocaleString()}`,
    body: text,
    link: `/admin/daily-summary/${data.summaryId}`,
  }).catch((e) => console.warn("[report] Email report failed:", e));

  return { success: true, reportText: text };
}
