"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Plus, Loader2, Users } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface SuperAdminRolesPageProps {
  customRoles: Array<Record<string, unknown>>;
  admins: Array<Record<string, unknown>>;
}

const ROLE_OPTIONS = ["reviewer", "sub_admin", "super_admin"];

export function SuperAdminRolesPage({ customRoles, admins }: SuperAdminRolesPageProps) {
  const supabase = createClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function changeRole(userId: string, newRole: string) {
    setUpdatingId(userId);
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); window.location.reload(); }
    setUpdatingId(null);
  }

  const ROLE_COLORS: Record<string, string> = {
    reviewer: "bg-yellow-500/10 text-yellow-700",
    sub_admin: "bg-purple-500/10 text-purple-700",
    super_admin: "bg-red-500/10 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground">Manage admin and reviewer role assignments</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Platform Staff ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {admins.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No staff members yet</p>
              ) : admins.map(admin => (
                <div key={admin.id as string} className="flex items-center gap-3 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials((admin.full_name as string) ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{admin.full_name as string}</p>
                    <p className="text-xs text-muted-foreground truncate">{admin.email as string}</p>
                  </div>
                  <Select
                    value={admin.role as string}
                    onValueChange={(v: string | null) => { if (v) changeRole(admin.id as string, v); }}
                    disabled={updatingId === admin.id as string}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r} value={r} className="text-xs capitalize">{r.replace("_", " ")}</SelectItem>
                      ))}
                      <SelectItem value="founder" className="text-xs">Remove (Founder)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" /> Role Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                role: "reviewer",
                color: ROLE_COLORS.reviewer,
                permissions: ["View assigned pitches", "Submit reviews", "Score pitches", "Add review comments"],
              },
              {
                role: "sub_admin",
                color: ROLE_COLORS.sub_admin,
                permissions: ["All reviewer permissions", "Manage users", "Manage pitches", "View analytics", "Manage events"],
              },
              {
                role: "super_admin",
                color: ROLE_COLORS.super_admin,
                permissions: ["All admin permissions", "Manage roles", "Platform settings", "Audit logs", "Feature flags"],
              },
            ].map(item => (
              <div key={item.role} className="rounded-lg border p-3 space-y-2">
                <Badge variant="outline" className={`text-xs capitalize ${item.color}`}>{item.role.replace("_", " ")}</Badge>
                <ul className="space-y-1">
                  {item.permissions.map(p => (
                    <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary inline-block" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
