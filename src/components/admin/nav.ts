import {
  Bell,
  BookOpen,
  Boxes,
  Briefcase,
  Cake,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Contact,
  FileText,
  FolderKanban,
  GaugeCircle,
  Gift,
  Images,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  MessagesSquare,
  Megaphone,
  Plug,
  ReceiptText,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Department } from "@/lib/brands";

/**
 * Admin console navigation for Cakestry Bakery.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  department?: Department;
  permission?: string;
  badgeKey?: "openTickets" | "newLeads" | "newAdmissions";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
      {
        label: "Live Conversations",
        href: "/admin/conversations",
        icon: MessagesSquare,
        permission: "conversations.view",
      },
    ],
  },
  {
    label: "Bakery Orders & CRM",
    items: [
      {
        label: "Cake Orders",
        href: "/admin/crm/leads",
        icon: Briefcase,
        department: "MARKETING",
        permission: "crm.leads.view",
        badgeKey: "newLeads",
      },
      {
        label: "Event Inquiries",
        href: "/admin/crm/admissions",
        icon: ClipboardList,
        department: "INSTITUTE",
        permission: "crm.admissions.view",
        badgeKey: "newAdmissions",
      },
      {
        label: "Customers",
        href: "/admin/crm/customers",
        icon: Contact,
        department: "MARKETING",
        permission: "customers.manage",
      },
      {
        label: "Event Clients",
        href: "/admin/crm/students",
        icon: UsersRound,
        department: "INSTITUTE",
        permission: "students.manage",
      },
      {
        label: "Follow-ups",
        href: "/admin/crm/follow-ups",
        icon: CalendarClock,
        permission: "dashboard.view",
      },
    ],
  },
  {
    label: "Catalogue & Menu",
    items: [
      {
        label: "Bakery Products",
        href: "/admin/catalogue/services",
        icon: Boxes,
        department: "MARKETING",
        permission: "services.manage",
      },
      {
        label: "Custom Orders",
        href: "/admin/catalogue/projects",
        icon: FolderKanban,
        department: "MARKETING",
        permission: "customers.manage",
      },
      {
        label: "Gallery Portfolio",
        href: "/admin/catalogue/portfolio",
        icon: Images,
        department: "MARKETING",
        permission: "portfolio.manage",
      },
      {
        label: "Event Packages",
        href: "/admin/catalogue/courses",
        icon: Gift,
        department: "INSTITUTE",
        permission: "courses.manage",
      },
      {
        label: "Scheduled Events",
        href: "/admin/catalogue/batches",
        icon: CalendarDays,
        department: "INSTITUTE",
        permission: "courses.manage",
      },
      {
        label: "Bakery Staff",
        href: "/admin/catalogue/faculty",
        icon: Users,
        department: "INSTITUTE",
        permission: "courses.manage",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Knowledge Base",
        href: "/admin/knowledge",
        icon: BookOpen,
        permission: "knowledge.view",
      },
      { label: "Media & Photos", href: "/admin/media", icon: FileText, permission: "knowledge.manage" },
      { label: "Special Offers", href: "/admin/events", icon: CalendarDays, permission: "knowledge.manage" },
      { label: "AI Retraining", href: "/admin/ai-training", icon: Sparkles, permission: "knowledge.publish" },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Support Tickets",
        href: "/admin/support/tickets",
        icon: LifeBuoy,
        permission: "tickets.view",
        badgeKey: "openTickets",
      },
      { label: "Tastings & Meetings", href: "/admin/meetings", icon: CalendarClock, permission: "meetings.manage" },
      {
        label: "Order Quotations",
        href: "/admin/quotes",
        icon: ReceiptText,
        department: "MARKETING",
        permission: "quotes.manage",
      },
    ],
  },
  {
    label: "Messaging",
    items: [
      {
        label: "WhatsApp Inbox",
        href: "/admin/messaging/whatsapp",
        icon: MessageCircle,
        permission: "conversations.view",
      },
      {
        label: "WhatsApp Templates",
        href: "/admin/messaging/templates",
        icon: Send,
        permission: "broadcasts.send",
      },
      {
        label: "Broadcasts",
        href: "/admin/messaging/broadcasts",
        icon: Megaphone,
        permission: "broadcasts.send",
      },
      { label: "Notifications", href: "/admin/notifications", icon: Bell, permission: "dashboard.view" },
    ],
  },
  {
    label: "Developer & Admin",
    items: [
      { label: "Reports & Analytics", href: "/admin/reports", icon: GaugeCircle, permission: "reports.view" },
      { label: "User Management", href: "/admin/users", icon: Users, permission: "users.manage" },
      { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck, permission: "users.manage" },
      { label: "System Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
      { label: "Integrations & APIs", href: "/admin/integrations", icon: Plug, permission: "settings.manage" },
      { label: "Developer Logs", href: "/admin/logs", icon: ScrollText, permission: "logs.view" },
    ],
  },
];

export const DEPARTMENT_ICON: Record<Department, LucideIcon> = {
  MARKETING: Cake,
  INSTITUTE: Gift,
};

export function visibleNav(
  department: Department | null | undefined,
  permissions: Set<string> | null
): NavGroup[] {
  return ADMIN_NAV.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => {
      if (department && item.department && item.department !== department) return false;
      if (permissions && item.permission && !permissions.has(item.permission)) return false;
      return true;
    }),
  })).filter((group) => group.items.length > 0);
}
