"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface Props {
  conversations: Record<string, unknown>[];
  currentUserId: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id: string;
}

export default function MessagingPage({ conversations: initialConvos, currentUserId }: Props) {
  const [conversations, setConversations] = useState(initialConvos);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConvos.length > 0 ? (initialConvos[0].id as string) : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    if (!activeConvId) return;

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []));

    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !activeConvId) return;
    setSending(true);

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConvId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });

    if (error) { toast.error("Failed to send message"); }
    else {
      setNewMessage("");
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConvId);
    }
    setSending(false);
  }

  function getOtherParticipant(conv: Record<string, unknown>) {
    const participants = (conv.participants as { user: Record<string, unknown> }[]) ?? [];
    return participants.find((p) => p.user.id !== currentUserId)?.user ?? null;
  }

  const filteredConvos = conversations.filter((c) => {
    const other = getOtherParticipant(c);
    return (other?.full_name as string ?? "").toLowerCase().includes(search.toLowerCase());
  });

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
        <p className="text-muted-foreground">
          Connect with investors or founders to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl border overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col flex-shrink-0">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConvos.map((conv) => {
            const other = getOtherParticipant(conv);
            const lastMsg = (conv.last_message as Record<string, unknown>[] | null)?.[0];
            const isActive = conv.id === activeConvId;

            return (
              <button
                key={conv.id as string}
                onClick={() => setActiveConvId(conv.id as string)}
                className={`w-full px-4 py-3 text-left border-b last:border-0 hover:bg-muted/50 transition-colors ${
                  isActive ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    {getInitials((other?.full_name as string) ?? "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{other?.full_name as string ?? "Unknown"}</p>
                      {lastMsg && (
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                          {formatRelativeTime(lastMsg.created_at as string)}
                        </p>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate">
                        {(lastMsg.sender_id as string) === currentUserId ? "You: " : ""}
                        {lastMsg.content as string}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center gap-3">
              {(() => {
                const other = getOtherParticipant(activeConv);
                return (
                  <>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {getInitials((other?.full_name as string) ?? "?")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{other?.full_name as string}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {(other?.role as string ?? "").replace(/_/g, " ")}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm pt-8">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                className="flex-1"
              />
              <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
