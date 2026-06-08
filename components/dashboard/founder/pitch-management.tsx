"use client";

import { useState } from "react";
import { PitchWizard } from "./pitch-wizard";
import { PitchDetail } from "./pitch-detail";
import type { Pitch } from "@/types";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface PitchManagementProps {
  startup: { id: string; name: string };
  pitch: Pitch | null;
  versions: Array<{ id: string; version: number; change_summary: string | null; created_at: string }>;
}

export function PitchManagement({ startup, pitch, versions }: PitchManagementProps) {
  const [creating, setCreating] = useState(false);

  if (!pitch || creating) {
    return (
      <PitchWizard
        startupId={startup.id}
        startupName={startup.name}
        existingPitch={pitch ?? undefined}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <PitchDetail
      pitch={pitch}
      versions={versions}
      onEdit={() => setCreating(true)}
    />
  );
}
