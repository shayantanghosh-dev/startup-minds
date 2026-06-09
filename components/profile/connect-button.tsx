"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, Check, Mail } from "lucide-react";
import { toast } from "sonner";

interface ConnectButtonProps {
  targetUserId: string;
  targetName: string;
  initialStatus: string | null;
}

export function ConnectButton({ targetUserId, targetName, initialStatus }: ConnectButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send request");
        return;
      }
      setStatus("pending");
      toast.success(`Connection request sent to ${targetName}`);
    } catch {
      toast.error("Failed to send connection request");
    } finally {
      setLoading(false);
    }
  }

  if (status === "accepted") {
    return (
      <Button size="sm" variant="secondary" disabled className="gap-2">
        <Check className="h-3.5 w-3.5" /> Connected
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button size="sm" variant="outline" disabled className="gap-2">
        <Clock className="h-3.5 w-3.5" /> Request Sent
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleConnect} disabled={loading} className="gap-2">
      <UserPlus className="h-3.5 w-3.5" />
      {loading ? "Sending…" : "Connect"}
    </Button>
  );
}
