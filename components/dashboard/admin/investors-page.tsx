"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { Search, CheckCircle, XCircle, Clock, Shield } from "lucide-react";

interface AdminInvestorsPageProps {
  investors: Array<Record<string, unknown>>;
}

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-yellow-600" },
  under_review: { label: "Under Review", color: "text-blue-600" },
  approved: { label: "Approved", color: "text-green-600" },
  rejected: { label: "Rejected", color: "text-red-600" },
};

export function AdminInvestorsPage({ investors }: AdminInvestorsPageProps) {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filterKyc, setFilterKyc] = useState("all");

  const filtered = investors.filter(inv => {
    const user = inv.users as Record<string, unknown> | null;
    const name = (user?.full_name as string ?? "").toLowerCase();
    const email = (user?.email as string ?? "").toLowerCase();
    const org = (inv.organization as string ?? "").toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q || name.includes(q) || email.includes(q) || org.includes(q);
    const matchesKyc = filterKyc === "all" || inv.kyc_status === filterKyc;
    return matchesSearch && matchesKyc;
  });

  async function verifyInvestor(investorId: string, verified: boolean) {
    const { error } = await supabase.from("investors").update({
      is_verified: verified,
      kyc_status: verified ? "approved" : "rejected",
    }).eq("id", investorId);
    if (error) toast.error(error.message);
    else { toast.success(verified ? "Investor verified" : "Investor rejected"); window.location.reload(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Investors</h1>
        <p className="text-muted-foreground">Manage investor profiles and KYC verification</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search investors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterKyc} onValueChange={(v: string | null) => { if (v) setFilterKyc(v); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="KYC Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Shield className="mr-2 h-5 w-5" /> No investors found
              </div>
            ) : filtered.map(inv => {
              const user = inv.users as Record<string, unknown> | null;
              const kyc = inv.kyc_status as string;
              const statusCfg = KYC_STATUS_CONFIG[kyc] ?? KYC_STATUS_CONFIG.pending;
              const kycDocs = (inv.kyc_documents as Array<Record<string, unknown>>) ?? [];

              return (
                <div key={inv.id as string} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={(user?.avatar_url as string) ?? ""} />
                    <AvatarFallback>{getInitials((user?.full_name as string) ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{(user?.full_name as string) ?? "Unknown"}</p>
                      {!!(inv.is_verified) && <Badge variant="default" className="text-xs bg-green-500">Verified</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{(user?.email as string) ?? ""}</p>
                    {!!(inv.organization) && <p className="text-xs text-muted-foreground">{inv.organization as string}</p>}
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-xs font-medium">{kycDocs.length} docs</p>
                    <p className="text-xs text-muted-foreground">KYC files</p>
                  </div>
                  <div className={`text-xs font-medium hidden md:block ${statusCfg.color}`}>
                    {statusCfg.label}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {kyc !== "approved" && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10 h-8"
                        onClick={() => verifyInvestor(inv.id as string, true)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verify
                      </Button>
                    )}
                    {kyc !== "rejected" && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-500/30 hover:bg-red-500/10 h-8"
                        onClick={() => verifyInvestor(inv.id as string, false)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
