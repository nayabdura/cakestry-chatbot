import { sendDailyBakeryReportToOwner } from "../src/lib/reports/daily-bakery-report";

async function main() {
  console.log("[report-script] Triggering Daily 11:00 PM PKT Bakery Report...");
  const res = await sendDailyBakeryReportToOwner();
  console.log("[report-script] Report delivered successfully:");
  console.log(res.reportText);
}

main().catch((err) => {
  console.error("Report script error:", err);
  process.exit(1);
});
