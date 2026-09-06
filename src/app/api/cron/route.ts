import { sendDailyBakeryReportToOwner } from "@/lib/reports/daily-bakery-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await sendDailyBakeryReportToOwner();
    return Response.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
        report: result.reportText,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[cron] report failed:", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
