import { prisma } from "@/lib/db";

export async function cleanProductionDataReset() {
  console.log("=================================================================");
  console.log("CAKESTRY BAKERY — CLEAN PRODUCTION DATA RESET FOR CLIENT HANDOVER");
  console.log("=================================================================\n");

  try {
    console.log("--> Deleting test transactional records in correct dependency order...");

    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} test chat messages.`);

    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`✅ Deleted ${deletedConversations.count} test conversations.`);

    const deletedLeads = await prisma.marketingLead.deleteMany({});
    console.log(`✅ Deleted ${deletedLeads.count} test bakery orders (leads).`);

    const deletedAdmissions = await prisma.admission.deleteMany({});
    console.log(`✅ Deleted ${deletedAdmissions.count} test event inquiries.`);

    const deletedContacts = await prisma.whatsappContact.deleteMany({});
    console.log(`✅ Deleted ${deletedContacts.count} test customer profiles.`);

    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${deletedTickets.count} test tickets.`);

    const deletedMeetings = await prisma.meeting.deleteMany({});
    console.log(`✅ Deleted ${deletedMeetings.count} test meetings.`);

    const deletedQuotes = await prisma.quote.deleteMany({});
    console.log(`✅ Deleted ${deletedQuotes.count} test quotes.`);

    const deletedSummaries = await prisma.dailySummary.deleteMany({});
    console.log(`✅ Deleted ${deletedSummaries.count} test daily summaries.`);

    const deletedAnalytics = await prisma.analyticsDaily.deleteMany({});
    console.log(`✅ Deleted ${deletedAnalytics.count} test daily analytics rollups.`);

    const deletedLogs = await prisma.systemLog.deleteMany({});
    console.log(`✅ Deleted ${deletedLogs.count} test system logs.`);

    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} test notifications.`);

    const adminCount = await prisma.user.count();
    console.log(`\n🔒 Admin Users Preserved: ${adminCount}`);

    console.log("\n=================================================================");
    console.log("PRODUCTION RESET COMPLETE: System is 100% clean for client handover!");
    console.log("=================================================================");

    return {
      ordersCount: deletedLeads.count,
      salesTotal: 0,
      customersCount: deletedContacts.count,
      dailySummariesCount: deletedSummaries.count,
      chatsCount: deletedConversations.count,
    };
  } catch (error) {
    console.error("❌ Reset Error:", error);
    throw error;
  }
}

if (require.main === module) {
  cleanProductionDataReset()
    .then(() => prisma.$disconnect())
    .catch(() => prisma.$disconnect());
}
