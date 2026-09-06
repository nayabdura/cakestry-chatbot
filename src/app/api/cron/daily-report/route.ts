import { NextResponse } from "next/server";
import { sendDailyBakeryReportToOwner } from "@/lib/reports/daily-bakery-report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const result = await sendDailyBakeryReportToOwner();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      report: result.reportText,
    });
  } catch (error) {
    console.error("[cron/daily-report] failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
