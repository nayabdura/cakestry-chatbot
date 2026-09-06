import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";
import { sendText } from "@/lib/whatsapp/client";

export interface DailyBakeryReportData {
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  orders: Array<{
    reference: string;
    customerName: string;
    phone: string;
    amount: number;
    stage: string;
    details: string;
    createdAt: Date;
  }>;
}

export async function generateDailyBakeryReport(): Promise<DailyBakeryReportData> {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const leads = await prisma.marketingLead.findMany({
    where: {
      createdAt: { gte: startOfToday },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = leads.length;
  const deliveredOrders = leads.filter((l) => l.stage === "WON" || l.stage === "QUALIFIED").length;
  let totalRevenue = 0;

  const orders = leads.map((l) => {
    const val = Number(l.estimatedValue || 0);
    totalRevenue += val;
    return {
      reference: l.reference,
      customerName: l.name,
      phone: l.phone,
      amount: val,
      stage: l.stage,
      details: l.requirements,
      createdAt: l.createdAt,
    };
  });

  const reportData: DailyBakeryReportData = {
    date: now.toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" }),
    totalOrders,
    deliveredOrders,
    totalRevenue,
    orders,
  };

  // Upsert daily analytics record in DB
  await prisma.analyticsDaily.upsert({
    where: {
      date_department: {
        date: startOfToday,
        department: "MARKETING",
      },
    },
    update: {
      leads: totalOrders,
      revenue: totalRevenue,
    },
    create: {
      date: startOfToday,
      department: "MARKETING",
      leads: totalOrders,
      revenue: totalRevenue,
    },
  }).catch(() => {});

  return reportData;
}

export async function sendDailyBakeryReportToOwner(): Promise<{ success: boolean; reportText: string }> {
  const data = await generateDailyBakeryReport();

  let text = `📊 *CAKESTRY BAKERY — DAILY 11:00 PM PKT SUMMARY REPORT*\n`;
  text += `📅 Date: ${data.date}\n\n`;
  text += `📦 Total Orders Received Today: *${data.totalOrders}*\n`;
  text += `✅ Fulfilled / Qualified Orders: *${data.deliveredOrders}*\n`;
  text += `💰 *TOTAL DAILY SALES REVENUE: Rs. ${data.totalRevenue.toLocaleString()}*\n\n`;

  text += `📋 *ITEMIZED ORDER DETAILS:*\n`;
  if (data.orders.length === 0) {
    text += `_No orders recorded today._\n`;
  } else {
    data.orders.forEach((o, idx) => {
      text += `\n${idx + 1}. *#${o.reference}* — Rs. ${o.amount.toLocaleString()}\n`;
      text += `   👤 Name: ${o.customerName}\n`;
      text += `   📞 Phone: ${o.phone}\n`;
      text += `   📌 Status: ${o.stage}\n`;
    });
  }

  text += `\n✨ Report generated automatically by Cakestry AI Assistant.`;

  // Send WhatsApp report to Bakery Owner
  const ownerWaId = "923293110006";
  await sendText(ownerWaId, text).catch((e) => console.warn("[report] WhatsApp report failed:", e));

  // Send Email report to Bakery Owner
  await notifyTeam({
    department: "MARKETING",
    subject: `📊 Cakestry Bakery Daily 11:00 PM Report — Rs. ${data.totalRevenue.toLocaleString()}`,
    body: text,
    link: "/admin/reports",
  }).catch((e) => console.warn("[report] Email report failed:", e));

  return { success: true, reportText: text };
}
