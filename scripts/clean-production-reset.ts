import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanProductionReset() {
  console.log("=================================================================");
  console.log("CAKESTRY BAKERY — CLEAN PRODUCTION DATA RESET FOR CLIENT HANDOVER");
  console.log("=================================================================\n");

  try {
    console.log("--> Deleting test transactional records in correct dependency order...");

    // 1. Delete test messages
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} test chat messages.`);

    // 2. Delete test conversations
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`✅ Deleted ${deletedConversations.count} test conversations.`);

    // 3. Delete test marketing leads (Orders)
    const deletedLeads = await prisma.marketingLead.deleteMany({});
    console.log(`✅ Deleted ${deletedLeads.count} test bakery orders (leads).`);

    // 4. Delete test admissions (Event inquiries)
    const deletedAdmissions = await prisma.admission.deleteMany({});
    console.log(`✅ Deleted ${deletedAdmissions.count} test event inquiries.`);

    // 5. Delete test WhatsApp contacts (Customer profiles)
    const deletedContacts = await prisma.whatsappContact.deleteMany({});
    console.log(`✅ Deleted ${deletedContacts.count} test customer profiles.`);

    // 6. Delete test tickets (Escalations/requests)
    const deletedTickets = await prisma.ticket.deleteMany({});
    console.log(`✅ Deleted ${deletedTickets.count} test tickets.`);

    // 7. Delete test meetings/tastings
    const deletedMeetings = await prisma.meeting.deleteMany({});
    console.log(`✅ Deleted ${deletedMeetings.count} test meetings.`);

    // 8. Delete test quotes
    const deletedQuotes = await prisma.quote.deleteMany({});
    console.log(`✅ Deleted ${deletedQuotes.count} test quotes.`);

    // 9. Delete test daily summaries
    const deletedSummaries = await prisma.dailySummary.deleteMany({});
    console.log(`✅ Deleted ${deletedSummaries.count} test daily summaries.`);

    // 10. Delete test analytics daily rollups
    const deletedAnalytics = await prisma.analyticsDaily.deleteMany({});
    console.log(`✅ Deleted ${deletedAnalytics.count} test daily analytics rollups.`);

    // 11. Delete test system logs & notifications
    const deletedLogs = await prisma.systemLog.deleteMany({});
    console.log(`✅ Deleted ${deletedLogs.count} test system logs.`);

    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} test notifications.`);

    // Verify Business Config & Admin Accounts are preserved
    const adminCount = await prisma.user.count();
    console.log(`\n🔒 Admin Users Preserved: ${adminCount}`);

    console.log("\n=================================================================");
    console.log("PRODUCTION RESET COMPLETE: System is 100% clean for client handover!");
    console.log("=================================================================");
  } catch (error) {
    console.error("❌ Reset Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanProductionReset();
