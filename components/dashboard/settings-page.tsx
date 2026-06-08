"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  full_name: z.string().min(2),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  twitter_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface Props {
  profile: Record<string, unknown> | null;
  notifPrefs: Record<string, unknown> | null;
}

export default function SettingsPage({ profile, notifPrefs: initialPrefs }: Props) {
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState(initialPrefs ?? {});
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: (profile?.full_name as string) ?? "",
      bio: (profile?.bio as string) ?? "",
      phone: (profile?.phone as string) ?? "",
      linkedin_url: (profile?.linkedin_url as string) ?? "",
      twitter_url: (profile?.twitter_url as string) ?? "",
      website_url: (profile?.website_url as string) ?? "",
    },
  });

  async function onSaveProfile(data: ProfileForm) {
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("id", profile?.id as string);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile updated");
    setSaving(false);
  }

  async function togglePref(key: string, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    await supabase
      .from("notification_preferences")
      .update({ [key]: value })
      .eq("user_id", profile?.id as string);
  }

  const NOTIF_PREFS = [
    { key: "email_pitch_updates", label: "Pitch status updates", description: "Get notified when your pitch status changes" },
    { key: "email_messages", label: "New messages", description: "Email notification for new messages" },
    { key: "email_connections", label: "Connection requests", description: "When someone wants to connect" },
    { key: "email_investor_interest", label: "Investor interest", description: "When an investor adds you to their CRM" },
    { key: "push_all", label: "Browser notifications", description: "Enable all in-app notifications" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Lock className="h-3.5 w-3.5 mr-1.5" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input {...register("full_name")} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea {...register("bio")} rows={3} className="resize-none" placeholder="Tell others about yourself..." />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register("phone")} placeholder="+91 99999 99999" />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input {...register("linkedin_url")} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="space-y-2">
                  <Label>Twitter URL</Label>
                  <Input {...register("twitter_url")} placeholder="https://twitter.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input {...register("website_url")} placeholder="https://..." />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIF_PREFS.map((pref) => (
                <div key={pref.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                  <Switch
                    checked={(prefs[pref.key] as boolean) ?? true}
                    onCheckedChange={(v) => togglePref(pref.key, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{profile?.email as string}</p>
                <p className="text-xs text-muted-foreground mt-1">Contact support to change your email</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Password</p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const { error } = await supabase.auth.resetPasswordForEmail(
                      profile?.email as string,
                      { redirectTo: `${window.location.origin}/auth/reset-password` }
                    );
                    if (!error) toast.success("Password reset email sent");
                  }}
                >
                  Send password reset email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
