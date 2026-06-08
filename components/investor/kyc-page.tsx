"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShieldCheck, Upload, CheckCircle2, Clock, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Investor } from "@/types";

const KYC_STATUS_CONFIG = {
  pending: { label: "Not Started", color: "secondary", icon: AlertCircle },
  under_review: { label: "Under Review", color: "default", icon: Clock },
  approved: { label: "Approved", color: "default", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "destructive", icon: X },
};

const DOCUMENT_TYPES = [
  "PAN Card",
  "Aadhaar Card",
  "Passport",
  "SEBI Registration",
  "Angel Fund Registration",
  "Company Registration Certificate",
  "Bank Statement",
];

interface KYCPageProps {
  investor: (Investor & { kyc_documents?: Array<Record<string, string>> }) | null;
  userId: string;
}

export function KYCPage({ investor, userId }: KYCPageProps) {
  const [step, setStep] = useState(investor ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      organization: investor?.organization ?? "",
      organization_type: investor?.organization_type ?? "",
      investment_thesis: investor?.investment_thesis ?? "",
      min_ticket_size: investor?.min_ticket_size ?? 0,
      max_ticket_size: investor?.max_ticket_size ?? 0,
    },
  });

  async function onProfileSubmit(data: Record<string, unknown>) {
    setIsSubmitting(true);
    try {
      if (investor) {
        await supabase.from("investors").update(data).eq("user_id", userId);
      } else {
        await supabase.from("investors").insert({ ...data, user_id: userId });
      }
      toast.success("Profile saved");
      setStep(1);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  const kyc_status = investor?.kyc_status ?? "pending";
  const statusConfig = KYC_STATUS_CONFIG[kyc_status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete KYC to access startup pitches and investment features
        </p>
      </div>

      {/* Status */}
      <Card className={kyc_status === "approved" ? "border-green-500/50 bg-green-50 dark:bg-green-950/20" : ""}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-8 w-8 ${
              kyc_status === "approved" ? "text-green-500" :
              kyc_status === "rejected" ? "text-red-500" :
              kyc_status === "under_review" ? "text-blue-500" :
              "text-muted-foreground"
            }`} />
            <div>
              <p className="font-semibold">KYC Status: {statusConfig.label}</p>
              {kyc_status === "approved" && (
                <p className="text-sm text-green-600">You have full access to all investor features</p>
              )}
              {kyc_status === "under_review" && (
                <p className="text-sm text-muted-foreground">Your documents are being verified. Usually takes 1-2 business days.</p>
              )}
              {kyc_status === "pending" && (
                <p className="text-sm text-muted-foreground">Complete the steps below to get verified</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
            Investor Profile
          </CardTitle>
          <CardDescription>Tell us about your investment background</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input placeholder="e.g. Sequoia Capital" {...register("organization")} />
              </div>
              <div className="space-y-2">
                <Label>Organization Type</Label>
                <Select onValueChange={(v) => setValue("organization_type", v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Angel Investor", "Venture Capital", "Family Office", "Corporate VC", "Private Equity", "Individual"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Investment Thesis</Label>
              <Textarea
                rows={3}
                placeholder="Describe your investment focus, criteria, and what you look for in startups..."
                {...register("investment_thesis")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Ticket Size (₹)</Label>
                <Input type="number" placeholder="e.g. 500000" {...register("min_ticket_size", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Max Ticket Size (₹)</Label>
                <Input type="number" placeholder="e.g. 10000000" {...register("max_ticket_size", { valueAsNumber: true })} />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {investor ? "Update Profile" : "Save & Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Step 2: Documents */}
      {investor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
              Identity Documents
            </CardTitle>
            <CardDescription>Upload at least one identity document for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {investor.kyc_documents && investor.kyc_documents.length > 0 ? (
              <div className="space-y-2">
                {investor.kyc_documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{doc.document_type}</p>
                      <Badge
                        variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <ShieldCheck className={`h-5 w-5 ${doc.status === "approved" ? "text-green-500" : "text-muted-foreground"}`} />
                  </div>
                ))}
              </div>
            ) : null}

            {kyc_status !== "approved" && (
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Upload Identity Document</p>
                <p className="text-xs text-muted-foreground mb-3">
                  PAN Card, Aadhaar, Passport, or SEBI Registration. Max 10MB.
                </p>
                <p className="text-xs text-muted-foreground mb-3">Accepted: PDF, JPG, PNG</p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
