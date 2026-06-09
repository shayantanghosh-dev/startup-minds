"use client";

import { useState } from "react";
import { PitchWizard } from "./pitch-wizard";
import { PitchWorkspace } from "./pitch-workspace";
import type { Pitch } from "@/types";

interface PitchManagementProps {
  startup: { id: string; name: string };
  pitch: Pitch | null;
  versions: Array<{ id: string; version: number; change_summary: string | null; created_at: string }>;
}

export function PitchManagement({ startup, pitch, versions }: PitchManagementProps) {
  const [showWizard, setShowWizard] = useState(false);

  // Show wizard for new pitch or when user explicitly enters edit mode
  if (!pitch || showWizard) {
    return (
      <PitchWizard
        startupId={startup.id}
        startupName={startup.name}
        existingPitch={pitch ?? undefined}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <PitchWorkspace
      startup={startup}
      pitch={pitch}
      versions={versions}
      onNewVersion={() => setShowWizard(true)}
    />
  );
}
