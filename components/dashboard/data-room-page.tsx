"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Database, Upload, FileText, Trash2, Plus, Loader2, FolderOpen } from "lucide-react";

const CATEGORIES = [
  { value: "financial", label: "Financial" },
  { value: "legal", label: "Legal" },
  { value: "technical", label: "Technical" },
  { value: "compliance", label: "Compliance" },
  { value: "ip", label: "Intellectual Property" },
  { value: "contracts", label: "Contracts" },
  { value: "cap_table", label: "Cap Table" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  financial: "bg-green-500/10 text-green-700 dark:text-green-400",
  legal: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  technical: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  compliance: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  ip: "bg-red-500/10 text-red-700 dark:text-red-400",
  contracts: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  cap_table: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

interface DataRoomPageProps {
  startup: { id: string; name: string } | null;
  dataRooms: Array<{
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    data_room_documents: Array<{
      id: string; name: string; file_type: string; file_size?: number; category: string; created_at: string;
    }>;
  }>;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DataRoomPage({ startup, dataRooms }: DataRoomPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(dataRooms[0]?.id ?? null);
  const [uploadCategory, setUploadCategory] = useState("other");
  const fileRef = useRef<HTMLInputElement>(null);

  const activeRoom = dataRooms.find(r => r.id === selectedRoom);
  const docs = activeRoom?.data_room_documents ?? [];

  async function createDataRoom() {
    if (!startup || !newRoomName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from("data_rooms").insert({
      startup_id: startup.id,
      name: newRoomName.trim(),
    }).select().single();
    if (error) toast.error(error.message);
    else { toast.success("Data room created"); setSelectedRoom(data.id); setNewRoomName(""); router.refresh(); }
    setCreating(false);
  }

  async function uploadFile(file: File) {
    if (!startup || !selectedRoom) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${startup.id}/${selectedRoom}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("data-room-files").upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("data-room-files").getPublicUrl(path);
      const { error: docErr } = await supabase.from("data_room_documents").insert({
        data_room_id: selectedRoom,
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || ext || "unknown",
        file_size: file.size,
        category: uploadCategory,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (docErr) throw docErr;
      toast.success("Document uploaded");
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Upload failed");
    }
    setUploading(false);
  }

  async function deleteDocument(docId: string) {
    const { error } = await supabase.from("data_room_documents").delete().eq("id", docId);
    if (error) toast.error(error.message);
    else { toast.success("Document deleted"); router.refresh(); }
  }

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-full bg-primary/10 p-4"><Database className="h-8 w-8 text-primary" /></div>
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-1">No Startup Profile</h3>
          <p className="text-muted-foreground text-sm">Create a startup profile first to set up a data room.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Room</h1>
        <p className="text-muted-foreground">Securely share due diligence documents with investors</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Data Rooms</CardTitle></CardHeader>
            <CardContent className="space-y-1 pb-3">
              {dataRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedRoom === room.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{room.name}</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-70 ml-6">{room.data_room_documents.length} docs</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">New Data Room</CardTitle></CardHeader>
            <CardContent className="space-y-2 pb-3">
              <Input placeholder="Room name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
              <Button size="sm" className="w-full" onClick={createDataRoom} disabled={creating || !newRoomName.trim()}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Room
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {!activeRoom ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Database className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Select or create a data room to get started</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{activeRoom.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label>Category</Label>
                      <Select value={uploadCategory} onValueChange={(v: string | null) => { if (v) setUploadCategory(v); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload Document
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
                    />
                  </div>

                  <Separator />

                  {docs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">No documents yet. Upload your first document.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[doc.category] ?? ""}`}>
                            {CATEGORIES.find(c => c.value === doc.category)?.label ?? doc.category}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
