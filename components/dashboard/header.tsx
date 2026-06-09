"use client";

import { Menu, Bell, Moon, Sun, Search, LogOut, Users, Building2, HelpCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { useNotificationsStore } from "@/store/notifications";
import type { User } from "@/types";
import Link from "next/link";

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: "startup" | "investor";
  subtitle?: string;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotificationsStore();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const roleSlug = user.role.replace("_", "-");
  const notifPath = `/dashboard/${roleSlug}/notifications`;
  const settingsPath = `/dashboard/${roleSlug}/settings`;
  const ROLE_HELP_LINKS: Record<string, string> = {
    founder: "/dashboard/founder/pitch",
    investor: "/dashboard/investor/discover",
    reviewer: "/dashboard/reviewer/queue",
    sub_admin: "/dashboard/admin/pitches",
    super_admin: "/dashboard/super-admin/settings",
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [{ data: startups }, { data: investors }] = await Promise.all([
          supabase.from("startups").select("id, name, tagline").ilike("name", `%${query}%`).limit(4),
          supabase.from("users").select("id, full_name, email").eq("role", "investor").ilike("full_name", `%${query}%`).limit(4),
        ]);
        const r: SearchResult[] = [
          ...(startups ?? []).map((s) => ({ id: s.id, name: s.name, type: "startup" as const, subtitle: s.tagline ?? undefined })),
          ...(investors ?? []).map((u) => ({ id: u.id, name: u.full_name, type: "investor" as const, subtitle: u.email })),
        ];
        setResults(r);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search startups, investors…"
            className="pl-9 pr-16 bg-muted border-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {!query && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground opacity-60">
              ⌘K
            </kbd>
          )}
        </div>
        {showResults && (
          <div className="absolute top-full mt-1 w-full bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
            {searching ? (
              <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-3">No results found</p>
            ) : (
              <ul>
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left transition-colors"
                      onClick={() => {
                        setQuery("");
                        setShowResults(false);
                        router.push(`/profile/${r.id}`);
                      }}
                    >
                      <div className={`p-1.5 rounded-full ${r.type === "startup" ? "bg-blue-100 dark:bg-blue-900" : "bg-purple-100 dark:bg-purple-900"}`}>
                        {r.type === "startup"
                          ? <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          : <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                        {r.type === "startup" ? "Startup" : "Investor"}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="relative hidden sm:flex" title="Quick action" asChild>
          <Link href={ROLE_HELP_LINKS[user.role] ?? "/"}>
            <HelpCircle className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href={notifPath}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src={user.avatar_url ?? ""} alt={user.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)}>
              View My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(settingsPath)}>
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
