"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { Search, Users, Shield, Ban, CheckCircle } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  founder: "bg-blue-500/10 text-blue-700",
  investor: "bg-green-500/10 text-green-700",
  reviewer: "bg-yellow-500/10 text-yellow-700",
  sub_admin: "bg-purple-500/10 text-purple-700",
  super_admin: "bg-red-500/10 text-red-700",
};

const USER_ROLES = ["founder", "investor", "reviewer", "sub_admin", "super_admin"];

interface SuperAdminUsersPageProps {
  users: Array<Record<string, unknown>>;
}

export function SuperAdminUsersPage({ users: initialUsers }: SuperAdminUsersPageProps) {
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = users.filter(u => {
    const name = (u.full_name as string ?? "").toLowerCase();
    const email = (u.email as string ?? "").toLowerCase();
    const q = search.toLowerCase();
    return (!q || name.includes(q) || email.includes(q)) && (filterRole === "all" || u.role === filterRole);
  });

  async function updateRole(userId: string, role: string) {
    const { error } = await supabase.from("users").update({ role }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u)); }
  }

  async function toggleActive(userId: string, current: boolean) {
    const { error } = await supabase.from("users").update({ is_active: !current }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success(!current ? "User activated" : "User deactivated"); setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u)); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">{users.length} total users · {users.filter(u => u.is_active).length} active</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterRole} onValueChange={(v: string | null) => { if (v) setFilterRole(v); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {USER_ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Users className="h-5 w-5" /> No users found
              </div>
            ) : filtered.map(user => (
              <div key={user.id as string} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={(user.avatar_url as string) ?? ""} />
                  <AvatarFallback>{getInitials((user.full_name as string) ?? "?")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{user.full_name as string}</p>
                    {!(user.is_active) && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email as string}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(user.created_at as string)}</p>
                </div>
                <Badge variant="outline" className={`text-xs hidden sm:flex ${ROLE_COLORS[user.role as string] ?? ""}`}>
                  {(user.role as string).replace("_", " ")}
                </Badge>
                <Select value={user.role as string} onValueChange={(v: string | null) => { if (v) updateRole(user.id as string, v); }}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 ${user.is_active ? "text-red-600 hover:text-red-600 hover:bg-red-50" : "text-green-600 hover:text-green-600 hover:bg-green-50"}`}
                  onClick={() => toggleActive(user.id as string, user.is_active as boolean)}
                >
                  {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
