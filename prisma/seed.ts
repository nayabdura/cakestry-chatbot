/**
 * =============================================================================
 *  Database seed — Cakestry AI Assistant
 * =============================================================================
 *
 *  Populates a production-ready starting state for Cakestry Bakery:
 *
 *    • RBAC — permissions, roles and role/permission grants
 *    • Users — developer super admin, bakery admin, staff agents
 *    • Cakestry Bakery — products, portfolio, reviews
 *    • Cakestry Special Events — event catering packages, upcoming events
 *    • Both knowledge bases
 *    • Settings, WhatsApp templates, announcements and events
 *
 *  Run with:  npm run db:seed
 * =============================================================================
 */
import { PrismaClient, type Department, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { MARKETING_SERVICES } from "../src/data/marketing/services";
import { MARKETING_KNOWLEDGE_BASE } from "../src/data/marketing/knowledge-base";
import { INSTITUTE_COURSES } from "../src/data/institute/courses";
import { INSTITUTE_KNOWLEDGE_BASE } from "../src/data/institute/knowledge-base";

const prisma = new PrismaClient();

const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

async function main() {
  console.log("🌱  Seeding the Cakestry AI Assistant database…\n");

  await seedPermissionsAndRoles();
  await seedUsers();
  await seedMarketing();
  await seedInstitute();
  await seedKnowledgeBases();
  await seedSettings();
  await seedContent();

  console.log("\n✅  Seed complete.");
}

// ------------------------------------------------------------------- RBAC ---

const PERMISSIONS: Array<{ key: string; group: string; description: string }> = [
  { key: "dashboard.view", group: "Dashboard", description: "View the admin dashboard" },
  { key: "conversations.view", group: "Conversations", description: "View live and past conversations" },
  { key: "conversations.takeover", group: "Conversations", description: "Take over a conversation from the assistant" },
  { key: "crm.leads.view", group: "CRM", description: "View marketing leads" },
  { key: "crm.leads.manage", group: "CRM", description: "Create, edit and move marketing leads" },
  { key: "crm.admissions.view", group: "CRM", description: "View admission inquiries" },
  { key: "crm.admissions.manage", group: "CRM", description: "Create, edit and move admission inquiries" },
  { key: "customers.manage", group: "CRM", description: "Manage customers" },
  { key: "students.manage", group: "Academics", description: "Manage students and enrollments" },
  { key: "courses.manage", group: "Academics", description: "Manage courses, batches and faculty" },
  { key: "attendance.manage", group: "Academics", description: "Mark and edit attendance" },
  { key: "certificates.issue", group: "Academics", description: "Issue certificates" },
  { key: "services.manage", group: "Catalogue", description: "Manage marketing services" },
  { key: "portfolio.manage", group: "Catalogue", description: "Manage portfolio and reviews" },
  { key: "knowledge.view", group: "Knowledge Base", description: "View knowledge base content" },
  { key: "knowledge.manage", group: "Knowledge Base", description: "Create and edit knowledge base content" },
  { key: "knowledge.publish", group: "Knowledge Base", description: "Publish and re-index knowledge base content" },
  { key: "tickets.view", group: "Support", description: "View support tickets" },
  { key: "tickets.manage", group: "Support", description: "Assign and resolve support tickets" },
  { key: "meetings.manage", group: "Support", description: "Confirm and reschedule meetings" },
  { key: "quotes.manage", group: "Sales", description: "Create and send quotations" },
  { key: "broadcasts.send", group: "Messaging", description: "Send WhatsApp and email broadcasts" },
  { key: "reports.view", group: "Reports", description: "View reports and analytics" },
  { key: "users.manage", group: "Administration", description: "Manage users, roles and permissions" },
  { key: "settings.manage", group: "Administration", description: "Manage settings and integrations" },
  { key: "logs.view", group: "Administration", description: "View system logs" },
];

const ROLES: Array<{
  key: string;
  name: string;
  description: string;
  department: Department | null;
  permissions: string[] | "ALL";
}> = [
  {
    key: "super-admin",
    name: "Developer / Super Admin",
    description: "Unrestricted system access for developer and admin console.",
    department: null,
    permissions: "ALL",
  },
  {
    key: "marketing-admin",
    name: "Bakery Admin",
    description: "Full access to Cakestry Bakery modules.",
    department: "MARKETING",
    permissions: [
      "dashboard.view", "conversations.view", "conversations.takeover",
      "crm.leads.view", "crm.leads.manage", "customers.manage",
      "services.manage", "portfolio.manage", "knowledge.view", "knowledge.manage",
      "knowledge.publish", "tickets.view", "tickets.manage", "meetings.manage",
      "quotes.manage", "broadcasts.send", "reports.view",
    ],
  },
  {
    key: "sales-agent",
    name: "Bakery Staff Agent",
    description: "Works the Cakestry Bakery cake order pipeline.",
    department: "MARKETING",
    permissions: [
      "dashboard.view", "conversations.view", "crm.leads.view", "crm.leads.manage",
      "customers.manage", "meetings.manage", "quotes.manage", "tickets.view",
    ],
  },
  {
    key: "institute-admin",
    name: "Events Admin",
    description: "Full access to Cakestry Special Events modules.",
    department: "INSTITUTE",
    permissions: [
      "dashboard.view", "conversations.view", "conversations.takeover",
      "crm.admissions.view", "crm.admissions.manage", "students.manage",
      "courses.manage", "attendance.manage", "certificates.issue",
      "knowledge.view", "knowledge.manage", "knowledge.publish",
      "tickets.view", "tickets.manage", "meetings.manage", "broadcasts.send",
      "reports.view",
    ],
  },
  {
    key: "admissions-officer",
    name: "Events Officer",
    description: "Works the Cakestry Special Events inquiry pipeline.",
    department: "INSTITUTE",
    permissions: [
      "dashboard.view", "conversations.view", "crm.admissions.view",
      "crm.admissions.manage", "students.manage", "meetings.manage", "tickets.view",
    ],
  },
  {
    key: "instructor",
    name: "Instructor",
    description: "Teaches batches; manages attendance and assignments.",
    department: "INSTITUTE",
    permissions: ["dashboard.view", "students.manage", "attendance.manage", "courses.manage"],
  },
];

async function seedPermissionsAndRoles() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { group: permission.group, description: permission.description },
      create: permission,
    });
  }
  console.log(`   ✔ Permissions: ${PERMISSIONS.length}`);

  const all = await prisma.permission.findMany({ select: { id: true, key: true } });
  const byKey = new Map(all.map((p) => [p.key, p.id]));

  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description, department: role.department },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        department: role.department,
        isSystem: true,
      },
    });

    const keys = role.permissions === "ALL" ? PERMISSIONS.map((p) => p.key) : role.permissions;
    // Replace grants wholesale so removing a permission from this file removes
    // it from the database too — the seed is the source of truth for roles.
    await prisma.rolePermission.deleteMany({ where: { roleId: record.id } });
    await prisma.rolePermission.createMany({
      data: keys
        .map((key) => byKey.get(key))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: record.id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log(`   ✔ Roles: ${ROLES.length}`);
}

// ------------------------------------------------------------------ Users ---

async function seedUsers() {
  const accounts = [
    {
      email: "developer@cakestry.com",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Password123!",
      name: "System Developer & Super Admin",
      role: "SUPER_ADMIN" as const,
      department: null,
      roleKey: "super-admin",
    },
    {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@cakestry.com",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Password123!",
      name: "Bakery Administrator",
      role: "ADMIN" as const,
      department: "MARKETING" as Department,
      roleKey: "marketing-admin",
    },
    {
      email: "staff@cakestry.com",
      password: process.env.SEED_STAFF_PASSWORD ?? "Password123!",
      name: "Bakery Staff Agent",
      role: "AGENT" as const,
      department: "MARKETING" as Department,
      roleKey: "sales-agent",
    },
    {
      email: "events@cakestry.com",
      password: process.env.SEED_STAFF_PASSWORD ?? "Password123!",
      name: "Events Staff Officer",
      role: "AGENT" as const,
      department: "INSTITUTE" as Department,
      roleKey: "admissions-officer",
    },
  ];

  for (const account of accounts) {
    const rbac = await prisma.role.findUnique({ where: { key: account.roleKey } });
    await prisma.user.upsert({
      where: { email: account.email },
      update: { role: account.role, department: account.department, roleId: rbac?.id },
      create: {
        name: account.name,
        email: account.email,
        passwordHash: await bcrypt.hash(account.password, rounds),
        role: account.role,
        department: account.department,
        roleId: rbac?.id,
      },
    });
  }
  console.log(`   ✔ Users: ${accounts.length} (admin: ${accounts[0].email})`);
}

// -------------------------------------------------------------- Marketing ---

async function seedMarketing() {
  for (const [index, service] of MARKETING_SERVICES.entries()) {
    await prisma.marketingService.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        group: service.group,
        tagline: service.tagline,
        overview: service.overview,
        benefits: service.benefits,
        features: service.features,
        process: service.process,
        priceFrom: service.pricing.startingAt,
        priceModel: service.pricing.model,
        priceNote: service.pricing.note,
        sortOrder: index,
      },
      create: {
        slug: service.slug,
        name: service.name,
        group: service.group,
        tagline: service.tagline,
        overview: service.overview,
        benefits: service.benefits,
        features: service.features,
        process: service.process,
        priceFrom: service.pricing.startingAt,
        priceModel: service.pricing.model,
        priceNote: service.pricing.note,
        sortOrder: index,
      },
    });

    // The catalogue's portfolio lines become browsable portfolio items so the
    // admin console has real content to manage from day one.
    for (const [i, item] of service.portfolio.entries()) {
      const slug = `${service.slug}-case-${i + 1}`;
      const record = await prisma.marketingService.findUnique({
        where: { slug: service.slug },
        select: { id: true },
      });
      await prisma.portfolioItem.upsert({
        where: { slug },
        update: { summary: item, serviceId: record?.id },
        create: {
          slug,
          department: "MARKETING",
          title: `${service.name} — case ${i + 1}`,
          summary: item,
          tags: [service.group],
          serviceId: record?.id,
          sortOrder: i,
        },
      });
    }
  }
  console.log(`   ✔ Marketing services: ${MARKETING_SERVICES.length}`);

  const reviews = [
    {
      department: "MARKETING" as Department,
      author: "Operations Director",
      role: "Retail group",
      rating: 5,
      body: "The WhatsApp automation paid for itself in the first month. Enquiries that used to sit unanswered overnight are now handled instantly.",
    },
    {
      department: "MARKETING" as Department,
      author: "Managing Partner",
      role: "Professional services firm",
      rating: 5,
      body: "They explained the trade-offs honestly instead of overselling, then delivered on schedule. We own the code and the ad accounts — no lock-in.",
    },
    {
      department: "INSTITUTE" as Department,
      author: "Graduate, Digital Marketing with AI",
      role: "Now freelancing",
      rating: 5,
      body: "The projects were real client work, not classroom exercises. I had a portfolio before the course finished and my first paying client a month later.",
    },
    {
      department: "INSTITUTE" as Department,
      author: "Graduate, Full Stack Web Development",
      role: "Junior developer",
      rating: 5,
      body: "Trainers who actually build software for a living. The final project got me through my first technical interview.",
    },
  ];

  for (const review of reviews) {
    const exists = await prisma.review.findFirst({
      where: { author: review.author, department: review.department },
    });
    if (!exists) await prisma.review.create({ data: review });
  }
  console.log(`   ✔ Reviews: ${reviews.length}`);
}

// -------------------------------------------------------------- Institute ---

const FACULTY = [
  {
    reference: "BI-FAC-0001",
    name: "Lead Trainer — Marketing",
    title: "Senior Digital Marketing Strategist",
    expertise: ["Digital Marketing", "Meta Ads", "Google Ads", "Analytics"],
    groups: ["Digital Marketing"],
  },
  {
    reference: "BI-FAC-0002",
    name: "Lead Trainer — Design & Media",
    title: "Brand & Motion Designer",
    expertise: ["Photoshop", "Illustrator", "Premiere Pro", "After Effects"],
    groups: ["Design & Media"],
  },
  {
    reference: "BI-FAC-0003",
    name: "Lead Trainer — Development",
    title: "Full Stack Engineer",
    expertise: ["React", "Next.js", "Node.js", "PostgreSQL"],
    groups: ["Development"],
  },
  {
    reference: "BI-FAC-0004",
    name: "Lead Trainer — Artificial Intelligence",
    title: "AI Solutions Architect",
    expertise: ["Prompt Engineering", "AI Agents", "Automation", "RAG"],
    groups: ["Artificial Intelligence"],
  },
  {
    reference: "BI-FAC-0005",
    name: "Lead Trainer — Business & Career",
    title: "Freelance & Startup Mentor",
    expertise: ["Freelancing", "Upwork", "Business Models", "Social Commerce"],
    groups: ["Business & Career"],
  },
];

async function seedInstitute() {
  const facultyByGroup = new Map<string, string>();

  for (const member of FACULTY) {
    const record = await prisma.faculty.upsert({
      where: { reference: member.reference },
      update: { name: member.name, title: member.title, expertise: member.expertise },
      create: {
        reference: member.reference,
        name: member.name,
        title: member.title,
        expertise: member.expertise,
      },
    });
    for (const group of member.groups) facultyByGroup.set(group, record.id);
  }
  console.log(`   ✔ Faculty: ${FACULTY.length}`);

  for (const [index, course] of INSTITUTE_COURSES.entries()) {
    const data = {
      name: course.name,
      group: course.group,
      tagline: course.tagline,
      overview: course.overview,
      curriculum: course.curriculum,
      duration: course.duration,
      feeFrom: course.fee.startingAt,
      feeModel: course.fee.model,
      feeNote: course.fee.note,
      instalments: course.instalments as unknown as Prisma.InputJsonValue,
      careers: course.careers,
      projects: course.projects,
      certification: course.certification,
      eligibility: course.eligibility,
      facultyId: facultyByGroup.get(course.group) ?? null,
      sortOrder: index,
    };

    await prisma.course.upsert({
      where: { slug: course.slug },
      update: data,
      create: { slug: course.slug, ...data },
    });
  }
  console.log(`   ✔ Courses: ${INSTITUTE_COURSES.length}`);

  // Upcoming batches for the four flagship courses, starting next month.
  const flagship = [
    "digital-marketing-with-ai",
    "graphic-designing",
    "full-stack-web-development",
    "freelancing",
  ];
  const start = new Date();
  start.setMonth(start.getMonth() + 1, 1);
  start.setHours(0, 0, 0, 0);

  const schedules = [
    "Mon / Wed / Fri · 6:00 – 8:00 PM",
    "Tue / Thu / Sat · 2:00 – 4:00 PM",
    "Mon – Thu · 9:00 – 11:00 AM",
    "Sat & Sun · 10:00 AM – 1:00 PM",
  ];

  for (const [index, slug] of flagship.entries()) {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true, facultyId: true },
    });
    if (!course) continue;

    const code = `${slug.slice(0, 8).toUpperCase()}-${start.getFullYear()}-${String(
      start.getMonth() + 1
    ).padStart(2, "0")}`;

    await prisma.batch.upsert({
      where: { code },
      update: { status: "ENROLLING", startDate: start, schedule: schedules[index] },
      create: {
        code,
        courseId: course.id,
        facultyId: course.facultyId,
        status: "ENROLLING",
        startDate: start,
        schedule: schedules[index],
        mode: index === 3 ? "Online / live" : "On-campus",
        seats: 25,
      },
    });
  }
  console.log(`   ✔ Upcoming batches: ${flagship.length}`);
}

// -------------------------------------------------------- Knowledge bases ---

async function seedKnowledgeBases() {
  for (const [index, entry] of MARKETING_KNOWLEDGE_BASE.entries()) {
    const data = {
      kind: entry.kind,
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      keywords: entry.keywords,
      state: "PUBLISHED" as const,
      indexedAt: new Date(),
      sortOrder: index,
    };
    await prisma.marketingKnowledge.upsert({
      where: { slug: entry.id },
      update: data,
      create: { slug: entry.id, ...data },
    });
  }
  console.log(`   ✔ Marketing knowledge base: ${MARKETING_KNOWLEDGE_BASE.length} entries`);

  for (const [index, entry] of INSTITUTE_KNOWLEDGE_BASE.entries()) {
    const data = {
      kind: entry.kind,
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      keywords: entry.keywords,
      state: "PUBLISHED" as const,
      indexedAt: new Date(),
      sortOrder: index,
    };
    await prisma.instituteKnowledge.upsert({
      where: { slug: entry.id },
      update: data,
      create: { slug: entry.id, ...data },
    });
  }
  console.log(`   ✔ Institute knowledge base: ${INSTITUTE_KNOWLEDGE_BASE.length} entries`);
}

// --------------------------------------------------------------- Settings ---

async function seedSettings() {
  const settings: Array<{
    key: string;
    group: string;
    department: Department | null;
    value: Prisma.InputJsonValue;
    description: string;
  }> = [
    {
      key: "branding.marketing",
      group: "branding",
      department: "MARKETING",
      value: { logoUrl: "", primaryColor: "#ea580c", accentColor: "#f97316" },
      description: "Cakestry Bakery logo and brand colours.",
    },
    {
      key: "branding.institute",
      group: "branding",
      department: "INSTITUTE",
      value: { logoUrl: "", primaryColor: "#9a3412", accentColor: "#c2410c" },
      description: "Cakestry Special Events logo and brand colours.",
    },
    {
      key: "company.marketing",
      group: "company",
      department: "MARKETING",
      value: {
        name: "Cakestry Bakery & Custom Cakes",
        phone: "+92 300 1234567",
        email: "order@cakestry.com",
        address: "Model Town, Bahawal Nagar, Punjab, Pakistan",
        hours: "Mon–Sun, 8:00 AM – 11:00 PM",
      },
      description: "Company details shown by the assistant and on the website.",
    },
    {
      key: "company.institute",
      group: "company",
      department: "INSTITUTE",
      value: {
        name: "Cakestry Special Events & Gift Boxes",
        phone: "+92 321 6759463",
        email: "events@cakestry.com",
        address: "Model Town, Bahawal Nagar, Punjab, Pakistan",
        hours: "Mon–Sun, 9:00 AM – 9:00 PM",
      },
      description: "Special Events details shown by the assistant and on the website.",
    },
    {
      key: "ai.defaults",
      group: "integrations",
      department: null,
      value: { provider: "openai", model: "gpt-3.5-turbo", maxTokens: 1400, thinking: false },
      description: "Default AI provider settings (env vars take precedence).",
    },
    {
      key: "chat.handoff",
      group: "general",
      department: null,
      value: { autoTicket: true, officeHoursOnly: false },
      description: "Human handoff behaviour for the assistant.",
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, group: setting.group, description: setting.description },
      create: setting,
    });
  }
  console.log(`   ✔ Settings: ${settings.length}`);
}

// ---------------------------------------------------------------- Content ---

async function seedContent() {
  const templates = [
    {
      key: "mk-lead-ack",
      department: "MARKETING" as Department,
      name: "Order acknowledgement",
      body: "Hi {{1}}, thanks for contacting Cakestry Bakery. Your cake order request {{2}} is logged and our team will call you within one hour.",
      variables: ["name", "reference"],
    },
    {
      key: "mk-meeting-confirm",
      department: "MARKETING" as Department,
      name: "Tasting session confirmed",
      body: "Hi {{1}}, your cake tasting is confirmed for {{2}} at {{3}}. Reference: {{4}}.",
      variables: ["name", "date", "time", "reference"],
    },
    {
      key: "in-admission-ack",
      department: "INSTITUTE" as Department,
      name: "Event inquiry acknowledgement",
      body: "Assalam-o-Alaikum {{1}}, your event catering inquiry for {{2}} is registered ({{3}}). An event officer will call you shortly.",
      variables: ["name", "course", "reference"],
    },
    {
      key: "in-batch-reminder",
      department: "INSTITUTE" as Department,
      name: "Scheduled event reminder",
      body: "Reminder: your {{1}} event starts on {{2}}. Timings: {{3}}. Please confirm final headcount.",
      variables: ["course", "startDate", "schedule"],
    },
    {
      key: "in-fee-reminder",
      department: "INSTITUTE" as Department,
      name: "Payment instalment reminder",
      body: "Hi {{1}}, your event booking deposit of {{2}} is due on {{3}}. Please contact us to arrange payment.",
      variables: ["name", "amount", "dueDate"],
    },
  ];

  for (const template of templates) {
    await prisma.whatsappTemplate.upsert({
      where: { key: template.key },
      update: { name: template.name, body: template.body, variables: template.variables },
      create: template,
    });
  }
  console.log(`   ✔ WhatsApp templates: ${templates.length}`);

  const announcements = [
    {
      department: "MARKETING" as Department,
      title: "Custom Birthday Cakes & Delivery Available",
      body: "Order 24 hours in advance for custom fondant and theme cakes. Delivery available across Bahawal Nagar.",
    },
    {
      department: "INSTITUTE" as Department,
      title: "Wedding Dessert Tables & Party Catering",
      body: "Special event packages available for wedding receptions, engagements, and corporate events.",
    },
  ];

  for (const announcement of announcements) {
    const exists = await prisma.announcement.findFirst({ where: { title: announcement.title } });
    if (!exists) await prisma.announcement.create({ data: announcement });
  }
  console.log(`   ✔ Announcements: ${announcements.length}`);

  const eventStart = new Date();
  eventStart.setDate(eventStart.getDate() + 14);
  eventStart.setHours(15, 0, 0, 0);

  const events = [
    {
      slug: "free-cake-tasting-weekend",
      department: "INSTITUTE" as Department,
      title: "Weekend Cake Tasting & Event Expo",
      summary:
        "Sample our signature cake flavors and meet our master bakers to plan your wedding or special event.",
      location: "Cakestry Bakery, Model Town, Bahawal Nagar",
      startsAt: eventStart,
    },
    {
      slug: "ai-for-business-workshop",
      department: "MARKETING" as Department,
      title: "Seasonal Dessert Specials Showcase",
      summary:
        "A hands-on workshop for business owners on automating customer replies, follow-ups and reporting.",
      location: "Online",
      startsAt: new Date(eventStart.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: { title: event.title, summary: event.summary, startsAt: event.startsAt },
      create: event,
    });
  }
  console.log(`   ✔ Events: ${events.length}`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
