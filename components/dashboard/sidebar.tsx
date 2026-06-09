"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import type { User } from "@/types";
import {
  LayoutDashboard, Rocket, Users, BarChart3, Bell, Settings,
  MessageSquare, Briefcase, Shield, FileText, Star, Trophy,
  Calendar, Search, X, Zap, DollarSign, UserCheck, ClipboardList,
  Database, Globe, Gavel, TrendingUp, ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  exact?: boolean;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_CONFIG: Record<string, NavSection[]> = {
  founder: [
    {
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/founder", exact: true },
      ],
    },
    {
      title: "My Startup",
      items: [
        { label: "Startup Profile", icon: Rocket, href: "/dashboard/founder/startup", exact: true },
        { label: "Pitch Deck", icon: FileText, href: "/dashboard/founder/pitch", exact: true },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/founder/analytics", exact: true },
      ],
    },
    {
      title: "Fundraising",
      items: [
        { label: "Investor Matches", icon: Users, href: "/dashboard/founder/investors", exact: true },
        { label: "Connections", icon: UserCheck, href: "/dashboard/founder/connections", exact: true },
        { label: "Messages", icon: MessageSquare, href: "/dashboard/founder/messages", exact: true },
        { label: "Deal Rooms", icon: Briefcase, href: "/dashboard/founder/deal-rooms", exact: false },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Data Room", icon: Database, href: "/dashboard/founder/data-room", exact: true },
        { label: "Events", icon: Calendar, href: "/dashboard/founder/events", exact: true },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Notifications", icon: Bell, href: "/dashboard/founder/notifications", exact: true },
        { label: "Settings", icon: Settings, href: "/dashboard/founder/settings", exact: true },
      ],
    },
  ],
  investor: [
    {
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/investor", exact: true },
      ],
    },
    {
      title: "Deal Flow",
      items: [
        { label: "Discover Startups", icon: Search, href: "/dashboard/investor/discover", exact: true },
        { label: "AI Matches", icon: Star, href: "/dashboard/investor/matches", exact: true },
        { label: "Leaderboard", icon: Trophy, href: "/dashboard/investor/leaderboard", exact: true },
      ],
    },
    {
      title: "Portfolio",
      items: [
        { label: "CRM Pipeline", icon: Briefcase, href: "/dashboard/investor/crm", exact: true },
        { label: "Deal Rooms", icon: Gavel, href: "/dashboard/investor/deal-rooms", exact: false },
        { label: "Portfolio", icon: DollarSign, href: "/dashboard/investor/portfolio", exact: true },
      ],
    },
    {
      title: "Network",
      items: [
        { label: "Connections", icon: UserCheck, href: "/dashboard/investor/connections", exact: true },
        { label: "Messages", icon: MessageSquare, href: "/dashboard/investor/messages", exact: true },
        { label: "Events", icon: Calendar, href: "/dashboard/investor/events", exact: true },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "KYC Verification", icon: Shield, href: "/dashboard/investor/kyc", exact: true },
        { label: "Notifications", icon: Bell, href: "/dashboard/investor/notifications", exact: true },
        { label: "Settings", icon: Settings, href: "/dashboard/investor/settings", exact: true },
      ],
    },
  ],
  reviewer: [
    {
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/reviewer", exact: true },
      ],
    },
    {
      title: "Reviews",
      items: [
        { label: "Review Queue", icon: ClipboardList, href: "/dashboard/reviewer/queue", exact: false },
        { label: "My Reviews", icon: FileText, href: "/dashboard/reviewer/reviews", exact: true },
      ],
    },
    {
      title: "Insights",
      items: [
        { label: "Analytics", icon: BarChart3, href: "/dashboard/reviewer/analytics", exact: true },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Settings", icon: Settings, href: "/dashboard/reviewer/settings", exact: true },
      ],
    },
  ],
  sub_admin: [
    {
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/admin", exact: true },
      ],
    },
    {
      title: "Users",
      items: [
        { label: "All Users", icon: Users, href: "/dashboard/admin/users", exact: true },
        { label: "Startups", icon: Rocket, href: "/dashboard/admin/startups", exact: true },
        { label: "Investors", icon: DollarSign, href: "/dashboard/admin/investors", exact: true },
      ],
    },
    {
      title: "Content",
      items: [
        { label: "Pitches", icon: FileText, href: "/dashboard/admin/pitches", exact: false },
        { label: "Events", icon: Calendar, href: "/dashboard/admin/events", exact: true },
        { label: "Announcements", icon: Bell, href: "/dashboard/admin/announcements", exact: true },
      ],
    },
    {
      title: "Platform",
      items: [
        { label: "Reports", icon: Shield, href: "/dashboard/admin/reports", exact: true },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/admin/analytics", exact: true },
        { label: "Settings", icon: Settings, href: "/dashboard/admin/settings", exact: true },
      ],
    },
  ],
  super_admin: [
    {
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard/super-admin", exact: true },
      ],
    },
    {
      title: "Users & Ecosystem",
      items: [
        { label: "All Users", icon: Users, href: "/dashboard/super-admin/users", exact: true },
        { label: "Startups", icon: Rocket, href: "/dashboard/super-admin/startups", exact: true },
        { label: "Investors", icon: DollarSign, href: "/dashboard/super-admin/investors", exact: true },
      ],
    },
    {
      title: "Content & Moderation",
      items: [
        { label: "Pitches", icon: FileText, href: "/dashboard/super-admin/pitches", exact: true },
        { label: "Reviews", icon: ClipboardList, href: "/dashboard/super-admin/reviews", exact: true },
        { label: "Events", icon: Calendar, href: "/dashboard/super-admin/events", exact: true },
      ],
    },
    {
      title: "Platform Intelligence",
      items: [
        { label: "Analytics", icon: TrendingUp, href: "/dashboard/super-admin/analytics", exact: true },
        { label: "Reports", icon: Globe, href: "/dashboard/super-admin/reports", exact: true },
        { label: "Audit Logs", icon: Database, href: "/dashboard/super-admin/audit-logs", exact: true },
      ],
    },
    {
      title: "Administration",
      items: [
        { label: "Roles & Permissions", icon: Shield, href: "/dashboard/super-admin/roles", exact: true },
        { label: "Platform Settings", icon: Settings, href: "/dashboard/super-admin/settings", exact: true },
      ],
    },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  investor: "Investor",
  reviewer: "Reviewer",
  sub_admin: "Administrator",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  founder: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  investor: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  reviewer: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  sub_admin: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface SidebarProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const sections = NAV_CONFIG[user.role] ?? NAV_CONFIG.founder;

  function isActive(item: NavItem) {
    return item.exact === false
      ? pathname === item.href || pathname.startsWith(item.href + "/")
      : pathname === item.href;
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-sidebar-foreground text-sm">StartupMinds</span>
              <p className="text-[10px] text-sidebar-foreground/50 leading-none mt-0.5">AI Fundraising Platform</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-3 space-y-5">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.title && (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-60 group-hover:opacity-100")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge className="h-4 px-1 text-[10px]">{item.badge}</Badge>
                        )}
                        {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.avatar_url ?? ""} alt={user.full_name} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.full_name}</p>
              <span className={cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5", ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700")}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
