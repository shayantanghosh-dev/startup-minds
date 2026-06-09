"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2 } from "lucide-react";

interface AdminSettingsPageProps {
  settings: Array<{ id: string; key: string; value: unknown; description?: string; is_public: boolean }>;
}

export function AdminSettingsPage({ settings: initialSettings }: AdminSettingsPageProps) {
  const supabase = createClient();
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function saveSetting(key: string, value: unknown) {
    setSavingKey(key);
    const { error } = await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) toast.error(error.message);
    else toast.success("Setting saved");
    setSavingKey(null);
  }

  function updateLocalValue(key: string, value: unknown) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  }

  function renderValue(setting: (typeof settings)[0]) {
    const val = setting.value;
    const isSaving = savingKey === setting.key;

    if (typeof val === "boolean" || val === "true" || val === "false") {
      const boolVal = val === true || val === "true";
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={boolVal}
            onCheckedChange={v => {
              updateLocalValue(setting.key, v);
              saveSetting(setting.key, v);
            }}
          />
          <span className="text-xs text-muted-foreground">{boolVal ? "Enabled" : "Disabled"}</span>
        </div>
      );
    }

    const strVal = typeof val === "string" ? val.replace(/^"|"$/g, "") : String(val);
    return (
      <div className="flex gap-2">
        <Input
          className="max-w-xs h-8 text-sm"
          value={strVal}
          onChange={e => updateLocalValue(setting.key, `"${e.target.value}"`)}
        />
        <Button size="sm" className="h-8" onClick={() => saveSetting(setting.key, setting.value)} disabled={!!isSaving}>
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings and feature flags</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" /> Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {settings.map(s => (
              <div key={s.key} className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{s.key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Label>
                    {s.is_public && <Badge variant="outline" className="text-xs">Public</Badge>}
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
                <div className="shrink-0">{renderValue(s)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
