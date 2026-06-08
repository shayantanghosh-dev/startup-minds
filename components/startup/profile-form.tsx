"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { createStartup, updateStartup } from "@/lib/actions/startup";
import type { Startup } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slogan: z.string().optional(),
  description: z.string().min(50, "Provide a description of at least 50 characters"),
  stage: z.enum(["idea", "pre_seed", "seed", "series_a", "series_b", "series_c", "growth", "ipo_ready"]),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().default("India"),
  city: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  dpiit_number: z.string().optional(),
  registered_address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "growth", label: "Growth" },
  { value: "ipo_ready", label: "IPO Ready" },
];

const INDUSTRIES = [
  "Technology", "FinTech", "HealthTech", "EdTech", "AgriTech",
  "CleanTech", "D2C", "SaaS", "AI/ML", "IoT", "Blockchain",
  "E-Commerce", "Logistics", "Real Estate", "Media & Entertainment", "Other",
];

interface StartupProfileFormProps {
  startup: (Startup & { startup_members?: Array<Record<string, string>> }) | null;
  userId: string;
}

export function StartupProfileForm({ startup, userId }: StartupProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState(startup?.startup_members ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: startup?.name ?? "",
      slogan: startup?.slogan ?? "",
      description: startup?.description ?? "",
      stage: startup?.stage ?? "idea",
      industry: startup?.industry ?? "",
      country: startup?.country ?? "India",
      city: startup?.city ?? "",
      website: startup?.website ?? "",
      dpiit_number: startup?.dpiit_number ?? "",
      registered_address: startup?.registered_address ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      if (startup) {
        await updateStartup(startup.id, data);
        toast.success("Startup profile updated!");
      } else {
        await createStartup(data);
        toast.success("Startup profile created!");
      }
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {startup ? "Edit Startup Profile" : "Create Startup Profile"}
        </h1>
        <p className="text-muted-foreground">
          Your startup profile is the foundation of your presence on StartupMinds
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic">
          <TabsList className="w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="social">Social & Links</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4 space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name *</Label>
                <Input id="name" placeholder="Your startup name" {...register("name")} />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slogan">Tagline / Slogan</Label>
                <Input id="slogan" placeholder="One line that captures your mission" {...register("slogan")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Describe what your startup does, who you serve, and why it matters..."
                  {...register("description")}
                />
                {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage *</Label>
                  <Select
                    defaultValue={watch("stage")}
                    onValueChange={(v) => setValue("stage", (v ?? "idea") as FormData["stage"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Select
                    defaultValue={watch("industry")}
                    onValueChange={(v) => setValue("industry", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="e.g. Bangalore" {...register("city")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input id="website" type="url" placeholder="https://yourstartup.com" {...register("website")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpiit_number">DPIIT Number</Label>
              <Input id="dpiit_number" placeholder="DIPP12345" {...register("dpiit_number")} />
              <p className="text-xs text-muted-foreground">
                Register with DPIIT to get the &quot;Verified Startup&quot; badge
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registered_address">Registered Address</Label>
              <Textarea id="registered_address" rows={3} {...register("registered_address")} />
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Team Members</h3>
                <p className="text-sm text-muted-foreground">Add co-founders and key team members</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMembers([...members, { id: Date.now().toString(), name: "", designation: "", email: "" }])}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </div>

            {members.map((member, idx) => (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Member {idx + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...members];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setMembers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Designation *</Label>
                      <Input
                        placeholder="e.g. CTO"
                        value={member.designation}
                        onChange={(e) => {
                          const updated = [...members];
                          updated[idx] = { ...updated[idx], designation: e.target.value };
                          setMembers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={member.email}
                        onChange={(e) => {
                          const updated = [...members];
                          updated[idx] = { ...updated[idx], email: e.target.value };
                          setMembers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Equity %</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        value={member.equity_percentage ?? ""}
                        onChange={(e) => {
                          const updated = [...members];
                          updated[idx] = { ...updated[idx], equity_percentage: e.target.value };
                          setMembers(updated);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="social" className="mt-4 space-y-4">
            {[
              { label: "LinkedIn URL", placeholder: "https://linkedin.com/company/..." },
              { label: "Twitter URL", placeholder: "https://twitter.com/..." },
              { label: "Instagram URL", placeholder: "https://instagram.com/..." },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <Label>{field.label}</Label>
                <Input type="url" placeholder={field.placeholder} />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {startup ? "Save Changes" : "Create Startup"}
          </Button>
        </div>
      </form>
    </div>
  );
}
