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
  Database, Globe, Gavel, TrendingUp,
} from "lucide-react";

// exact: true  → only highlight when pathname === href
// exact: false → also highlight for child routes (href + "/...")
const NAV_CONFIG: Record<string, { label: string; icon: React.ElementType; href: string; exact?: boolean }[]> = {
  founder: [
    { label: "Overview",      icon: LayoutDashboard, href: "/dashboard/founder",              exact: true  },
    { label: "My Startup",    icon: Rocket,          href: "/dashboard/founder/startup",       exact: true  },
    { label: "Pitch",         icon: FileText,        href: "/dashboard/founder/pitch",         exact: true  },
    { label: "Analytics",     icon: BarChart3,       href: "/dashboard/founder/analytics",     exact: true  },
    { label: "Investors",     icon: Users,           href: "/dashboard/founder/investors",     exact: true  },
    { label: "Deal Rooms",    icon: Briefcase,       href: "/dashboard/founder/deal-rooms",    exact: false },
    { label: "Data Room",     icon: Database,        href: "/dashboard/founder/data-room",     exact: true  },
    { label: "Messages",      icon: MessageSquare,   href: "/dashboard/founder/messages",      exact: true  },
    { label: "Events",        icon: Calendar,        href: "/dashboard/founder/events",        exact: true  },
    { label: "Notifications", icon: Bell,            href: "/dashboard/founder/notifications", exact: true  },
    { label: "Settings",      icon: Settings,        href: "/dashboard/founder/settings",      exact: true  },
  ],
  investor: [
    { label: "Overview",      icon: LayoutDashboard, href: "/dashboard/investor",              exact: true  },
    { label: "Discover",      icon: Search,          href: "/dashboard/investor/discover",     exact: true  },
    { label: "My CRM",        icon: Briefcase,       href: "/dashboard/investor/crm",          exact: true  },
    { label: "Portfolio",     icon: DollarSign,      href: "/dashboard/investor/portfolio",    exact: true  },
    { label: "Deal Rooms",    icon: Gavel,           href: "/dashboard/investor/deal-rooms",   exact: false },
    { label: "Matches",       icon: Star,            href: "/dashboard/investor/matches",      exact: true  },
    { label: "Leaderboard",   icon: Trophy,          href: "/dashboard/investor/leaderboard",  exact: true  },
    { label: "Events",        icon: Calendar,        href: "/dashboard/investor/events",       exact: true  },
    { label: "Messages",      icon: MessageSquare,   href: "/dashboard/investor/messages",     exact: true  },
    { label: "Notifications", icon: Bell,            href: "/dashboard/investor/notifications",exact: true  },
    { label: "KYC",           icon: UserCheck,       href: "/dashboard/investor/kyc",          exact: true  },
    { label: "Settings",      icon: Settings,        href: "/dashboard/investor/settings",     exact: true  },
  ],
  reviewer: [
    { label: "Overview",      icon: LayoutDashboard, href: "/dashboard/reviewer",              exact: true  },
    { label: "Review Queue",  icon: ClipboardList,   href: "/dashboard/reviewer/queue",        exact: false },
    { label: "My Reviews",    icon: FileText,        href: "/dashboard/reviewer/reviews",      exact: true  },
    { label: "Analytics",     icon: BarChart3,       href: "/dashboard/reviewer/analytics",    exact: true  },
    { label: "Settings",      icon: Settings,        href: "/dashboard/reviewer/settings",     exact: true  },
  ],
  sub_admin: [
    { label: "Overview",      icon: LayoutDashboard, href: "/dashboard/admin",                 exact: true  },
    { label: "Users",         icon: Users,           href: "/dashboard/admin/users",           exact: true  },
    { label: "Startups",      icon: Rocket,          href: "/dashboard/admin/startups",        exact: true  },
    { label: "Investors",     icon: DollarSign,      href: "/dashboard/admin/investors",       exact: true  },
    { label: "Pitches",       icon: FileText,        href: "/dashboard/admin/pitches",         exact: false },
    { label: "Events",        icon: Calendar,        href: "/dashboard/admin/events",          exact: true  },
    { label: "Reports",       icon: Shield,          href: "/dashboard/admin/reports",         exact: true  },
    { label: "Analytics",     icon: BarChart3,       href: "/dashboard/admin/analytics",       exact: true  },
    { label: "Settings",      icon: Settings,        href: "/dashboard/admin/settings",        exact: true  },
  ],
  super_admin: [
    { label: "Overview",         icon: LayoutDashboard, href: "/dashboard/super-admin",                exact: true  },
    { label: "Users",            icon: Users,           href: "/dashboard/super-admin/users",           exact: true  },
    { label: "Startups",         icon: Rocket,          href: "/dashboard/super-admin/startups",        exact: true  },
    { label: "Investors",        icon: DollarSign,      href: "/dashboard/super-admin/investors",       exact: true  },
    { label: "Pitches",          icon: FileText,        href: "/dashboard/super-admin/pitches",         exact: true  },
    { label: "Reviews",          icon: ClipboardList,   href: "/dashboard/super-admin/reviews",         exact: true  },
    { label: "Roles & Perms",    icon: Shield,          href: "/dashboard/super-admin/roles",           exact: true  },
    { label: "Events",           icon: Calendar,        href: "/dashboard/super-admin/events",          exact: true  },
    { label: "Analytics",        icon: TrendingUp,      href: "/dashboard/super-admin/analytics",       exact: true  },
    { label: "Reports",          icon: Globe,           href: "/dashboard/super-admin/reports",         exact: true  },
    { label: "Audit Logs",       icon: Database,        href: "/dashboard/super-admin/audit-logs",      exact: true  },
    { label: "Platform Settings",icon: Settings,        href: "/dashboard/super-admin/settings",        exact: true  },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  investor: "Investor",
  reviewer: "Reviewer",
  sub_admin: "Sub Admin",
  super_admin: "Super Admin",
};

interface SidebarProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_CONFIG[user.role] ?? NAV_CONFIG.founder;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-foreground">StartupMinds</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact === false
                ? pathname === item.href || pathname.startsWith(item.href + "/")
                : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url ?? ""} alt={user.full_name} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.full_name}
              </p>
              <Badge variant="secondary" className="text-xs h-4 mt-0.5">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
