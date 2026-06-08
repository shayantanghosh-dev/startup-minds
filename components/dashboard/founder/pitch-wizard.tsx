"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { validateYoutubeUrl } from "@/lib/utils";
import type { Pitch } from "@/types";

const STEPS = [
  { id: "overview", title: "Company Overview", description: "Describe your company and the problem you solve" },
  { id: "solution", title: "Solution & Product", description: "Explain your solution, technology, and product features" },
  { id: "market", title: "Market & Traction", description: "TAM/SAM/SOM, traction metrics, and growth data" },
  { id: "business", title: "Business Model", description: "Revenue model, pricing strategy, and scalability" },
  { id: "fundraising", title: "Fundraising", description: "How much you are raising and how you will use the funds" },
  { id: "media", title: "Pitch Materials", description: "Pitch deck, screenshots, and demo video" },
];

const pitchSchema = z.object({
  company_overview: z.string().min(100, "Please provide at least 100 characters"),
  problem_statement: z.string().min(50, "Please describe the problem"),
  real_world_examples: z.string().optional(),
  solution_description: z.string().min(100, "Please describe your solution"),
  unique_value_proposition: z.string().min(30, "Describe what makes you unique"),
  revenue_model: z.string().min(30, "Describe your revenue model"),
  amount_raising: z.number().min(100000, "Minimum ₹1 Lakh"),
  demo_video_url: z.string().optional().refine((v) => !v || validateYoutubeUrl(v), {
    message: "Must be a valid YouTube URL",
  }),
});

type PitchFormData = z.infer<typeof pitchSchema>;

interface PitchWizardProps {
  startupId: string;
  startupName: string;
  existingPitch?: Pitch;
  onCancel: () => void;
}

export function PitchWizard({ startupId, startupName, existingPitch, onCancel }: PitchWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PitchFormData>({
    resolver: zodResolver(pitchSchema),
    defaultValues: {
      company_overview: existingPitch?.company_overview ?? "",
      problem_statement: existingPitch?.problem_statement ?? "",
      real_world_examples: existingPitch?.real_world_examples ?? "",
      solution_description: existingPitch?.solution_description ?? "",
      unique_value_proposition: existingPitch?.unique_value_proposition ?? "",
      revenue_model: existingPitch?.revenue_model ?? "",
      amount_raising: existingPitch?.amount_raising ?? 0,
      demo_video_url: existingPitch?.demo_video_url ?? "",
    },
  });

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (existingPitch) {
        handleDraftSave();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [existingPitch]);

  async function handleDraftSave() {
    setIsSaving(true);
    const values = watch();
    const data = {
      startup_id: startupId,
      status: "draft" as const,
      ...values,
    };

    if (existingPitch) {
      await supabase.from("pitches").update(data).eq("id", existingPitch.id);
    } else {
      await supabase.from("pitches").insert(data);
    }

    setIsSaving(false);
    toast.success("Draft saved");
  }

  async function onSubmit(data: PitchFormData) {
    setIsSubmitting(true);
    try {
      const pitchData = {
        startup_id: startupId,
        ...data,
        status: "submitted" as const,
        submitted_at: new Date().toISOString(),
        version: (existingPitch?.version ?? 0) + 1,
      };

      let pitchId = existingPitch?.id;

      if (existingPitch) {
        // Create version snapshot
        await supabase.from("pitch_versions").insert({
          pitch_id: existingPitch.id,
          startup_id: startupId,
          version: existingPitch.version,
          snapshot: existingPitch,
          change_summary: "Resubmission",
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
        await supabase.from("pitches").update(pitchData).eq("id", existingPitch.id);
      } else {
        const { data: newPitch, error } = await supabase
          .from("pitches")
          .insert(pitchData)
          .select()
          .single();

        if (error) throw error;
        pitchId = newPitch.id;
      }

      // Trigger AI analysis via API
      fetch("/api/pitch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId }),
      });

      toast.success("Pitch submitted successfully! AI analysis is running in the background.");
      onCancel();
    } catch (err) {
      toast.error("Failed to submit pitch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">
            {existingPitch ? "Update Pitch" : "Submit Pitch"} — {startupName}
          </h1>
          <Button variant="ghost" size="sm" onClick={handleDraftSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-1">{isSaving ? "Saving..." : "Save Draft"}</span>
          </Button>
        </div>
        <p className="text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</p>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Step tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(idx)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              idx === currentStep
                ? "bg-primary text-primary-foreground"
                : idx < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.title}
          </button>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Step 0: Overview */}
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company_overview">Company Overview *</Label>
                  <Textarea
                    id="company_overview"
                    rows={5}
                    placeholder="Provide a comprehensive overview of your company, what you do, who you serve, and your vision..."
                    {...register("company_overview")}
                  />
                  {errors.company_overview && (
                    <p className="text-destructive text-sm">{errors.company_overview.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="problem_statement">Problem Statement *</Label>
                  <Textarea
                    id="problem_statement"
                    rows={4}
                    placeholder="Describe the problem you are solving. Be specific about who faces this problem and why it matters..."
                    {...register("problem_statement")}
                  />
                  {errors.problem_statement && (
                    <p className="text-destructive text-sm">{errors.problem_statement.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="real_world_examples">Real World Examples</Label>
                  <Textarea
                    id="real_world_examples"
                    rows={3}
                    placeholder="Share real examples or stories that illustrate the pain point..."
                    {...register("real_world_examples")}
                  />
                </div>
              </>
            )}

            {/* Step 1: Solution */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="solution_description">Solution Description *</Label>
                  <Textarea
                    id="solution_description"
                    rows={5}
                    placeholder="Describe your solution in detail. How does it work? What technology does it use?"
                    {...register("solution_description")}
                  />
                  {errors.solution_description && (
                    <p className="text-destructive text-sm">{errors.solution_description.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unique_value_proposition">Unique Value Proposition *</Label>
                  <Textarea
                    id="unique_value_proposition"
                    rows={3}
                    placeholder="What makes your solution uniquely better than existing alternatives?"
                    {...register("unique_value_proposition")}
                  />
                  {errors.unique_value_proposition && (
                    <p className="text-destructive text-sm">{errors.unique_value_proposition.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Market */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Market sizing helps investors understand the scale of your opportunity.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "tam", label: "TAM (₹)", placeholder: "Total Addressable Market" },
                    { id: "sam", label: "SAM (₹)", placeholder: "Serviceable Addressable Market" },
                    { id: "som", label: "SOM (₹)", placeholder: "Serviceable Obtainable Market" },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type="number"
                        placeholder={field.placeholder}
                        {...register(field.id as "company_overview", { valueAsNumber: true })}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "monthly_revenue", label: "Monthly Revenue (₹)" },
                    { id: "total_customers", label: "Total Customers" },
                    { id: "mrr", label: "MRR (₹)" },
                    { id: "monthly_growth_rate", label: "Monthly Growth Rate (%)" },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type="number"
                        placeholder="0"
                        {...register(field.id as "company_overview", { valueAsNumber: true })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Business Model */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="revenue_model">Revenue Model *</Label>
                  <Textarea
                    id="revenue_model"
                    rows={4}
                    placeholder="How do you make money? SaaS subscriptions, transaction fees, licensing, etc."
                    {...register("revenue_model")}
                  />
                  {errors.revenue_model && (
                    <p className="text-destructive text-sm">{errors.revenue_model.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing_strategy">Pricing Strategy</Label>
                  <Textarea
                    id="pricing_strategy"
                    rows={3}
                    placeholder="Describe your pricing tiers, logic, and why customers pay what they pay..."
                    {...register("pricing_strategy" as "company_overview")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scalability_plan">Scalability Plan</Label>
                  <Textarea
                    id="scalability_plan"
                    rows={3}
                    placeholder="How will you scale this business? What are the key growth levers?"
                    {...register("scalability_plan" as "company_overview")}
                  />
                </div>
              </>
            )}

            {/* Step 4: Fundraising */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount_raising">Amount Raising (₹) *</Label>
                    <Input
                      id="amount_raising"
                      type="number"
                      placeholder="e.g. 5000000"
                      {...register("amount_raising", { valueAsNumber: true })}
                    />
                    {errors.amount_raising && (
                      <p className="text-destructive text-sm">{errors.amount_raising.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valuation_expectation">Valuation (₹)</Label>
                    <Input
                      id="valuation_expectation"
                      type="number"
                      placeholder="e.g. 50000000"
                      {...register("valuation_expectation" as "company_overview", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equity_offered">Equity Offered (%)</Label>
                    <Input
                      id="equity_offered"
                      type="number"
                      placeholder="e.g. 10"
                      min="0"
                      max="100"
                      {...register("equity_offered" as "company_overview", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Media */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demo_video_url">Demo Video (YouTube URL)</Label>
                  <Input
                    id="demo_video_url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register("demo_video_url")}
                  />
                  {errors.demo_video_url && (
                    <p className="text-destructive text-sm">{errors.demo_video_url.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    YouTube links only. Video must be under 10 minutes.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <p className="text-sm font-medium mb-1">Pitch Deck (PDF)</p>
                  <p className="text-xs text-muted-foreground mb-3">Upload your pitch deck. Max 50MB.</p>
                  <Button variant="outline" size="sm" type="button">
                    Upload PDF
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onCancel()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {currentStep === 0 ? "Cancel" : "Previous"}
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Pitch
          </Button>
        )}
      </div>
    </div>
  );
}
