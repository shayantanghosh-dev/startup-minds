"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/utils";
import { Search, MoreVertical, Shield, ShieldOff, CheckCircle } from "lucide-react";

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  founder: "secondary",
  investor: "default",
  reviewer: "secondary",
  sub_admin: "default",
  super_admin: "destructive",
};

interface Props {
  users: Record<string, unknown>[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

export default function AdminUsersPage({ users: initialUsers, currentUserId, isSuperAdmin }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = users.filter((u) => {
    const name = (u.full_name as string ?? "").toLowerCase();
    const email = (u.email as string ?? "").toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function toggleVerify(userId: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ is_verified: !current })
      .eq("id", userId);
    if (error) { toast.error("Failed to update"); return; }
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, is_verified: !current } : u)
    );
    toast.success(`User ${!current ? "verified" : "unverified"}`);
  }

  async function updateRole(userId: string, newRole: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) { toast.error("Failed to update role"); return; }
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
    );
    toast.success("Role updated");
  }

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const r = u.role as string;
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all platform users and their roles</p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {[
          { label: "Total", value: users.length, role: "all" },
          { label: "Founders", value: roleCounts.founder ?? 0, role: "founder" },
          { label: "Investors", value: roleCounts.investor ?? 0, role: "investor" },
          { label: "Reviewers", value: roleCounts.reviewer ?? 0, role: "reviewer" },
          { label: "Admins", value: (roleCounts.sub_admin ?? 0) + (roleCounts.super_admin ?? 0), role: "sub_admin" },
        ].map((stat) => (
          <button
            key={stat.role}
            onClick={() => setRoleFilter(stat.role)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              roleFilter === stat.role ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
            }`}
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Last Seen</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {getInitials(u.full_name as string ?? "")}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name as string}</p>
                            <p className="text-xs text-muted-foreground">{u.email as string}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_COLORS[u.role as string] ?? "secondary"} className="capitalize text-xs">
                          {(u.role as string ?? "").replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_verified ? (
                          <span className="text-xs flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unverified</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(u.created_at as string)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {u.last_seen_at ? formatDate(u.last_seen_at as string) : "Never"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== currentUserId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleVerify(u.id as string, u.is_verified as boolean)}>
                                {u.is_verified ? (
                                  <><ShieldOff className="h-4 w-4 mr-2" />Remove Verification</>
                                ) : (
                                  <><Shield className="h-4 w-4 mr-2" />Verify User</>
                                )}
                              </DropdownMenuItem>
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  {["founder", "investor", "reviewer", "sub_admin"].map((role) => (
                                    <DropdownMenuItem
                                      key={role}
                                      onClick={() => updateRole(u.id as string, role)}
                                      disabled={u.role === role}
                                    >
                                      Set as {role.replace(/_/g, " ")}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
