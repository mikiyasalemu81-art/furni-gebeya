"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  Send,
  ShieldCheck,
  ArrowLeft,
  Store,
  Flag,
  Ban,
  Check,
  CheckCheck,
  Bell,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation, Message, InAppNotification } from "@/lib/marketplace-types";
import { useAuth } from "@/components/auth/auth-provider";
import { ReportModal } from "@/components/moderation/report-modal";
import { VoiceRecorder, VoicePlayer } from "@/components/chat/voice-recorder";
import { ChatAndNotificationsSkeleton } from "@/components/skeletons/advanced-skeletons";

export function ChatClient({ locale }: { locale: string }) {
  const { user, openLogin } = useAuth();
  const searchParams = useSearchParams();
  const targetRecipientId = searchParams.get("recipientId");
  const listingId = searchParams.get("listingId");

  const [mainTab, setMainTab] = React.useState<"chats" | "notifications">("chats");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [notifications, setNotifications] = React.useState<InAppNotification[]>([]);
  const [selectedConv, setSelectedConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [loadingConv, setLoadingConv] = React.useState(true);
  const [loadingNotifs, setLoadingNotifs] = React.useState(false);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 1. Load Conversations
  const fetchConversations = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConv(false);
    }
  }, [user]);

  // Load Notifications
  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchConversations();
    fetchNotifications();
  }, [fetchConversations, fetchNotifications]);

  // 2. Handle direct recipient link initialization
  React.useEffect(() => {
    if (user && targetRecipientId) {
      (async () => {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "start_conversation",
              targetUserId: targetRecipientId,
              listingId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setSelectedConv(data.conversation);
            fetchConversations();
          }
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [user, targetRecipientId, listingId, fetchConversations]);

  // 3. Fetch Messages for selected conversation
  const fetchMessages = React.useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    if (!selectedConv) return;
    setLoadingMsgs(true);
    fetchMessages(selectedConv.id).finally(() => setLoadingMsgs(false));

    // Polling interval fallback for active chat window
    const interval = setInterval(() => {
      fetchMessages(selectedConv.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConv, fetchMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || !user) return;

    const otherId =
      selectedConv.participant_one_id === user.id
        ? selectedConv.participant_two_id
        : selectedConv.participant_one_id;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          conversationId: selectedConv.id,
          recipientId: otherId,
          messageText: inputText,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to send message.");
        return;
      }

      setInputText("");
      fetchMessages(selectedConv.id);
      fetchConversations();
    } catch (e: any) {
      alert(e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, durationSeconds: number) => {
    if (!selectedConv || !user) return;
    const otherId =
      selectedConv.participant_one_id === user.id
        ? selectedConv.participant_two_id
        : selectedConv.participant_one_id;

    setSending(true);
    try {
      // 1. Upload audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice.webm");
      formData.append("duration", String(durationSeconds));

      const uploadRes = await fetch("/api/chat/upload-voice", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload voice message.");
      }

      const uploadData = await uploadRes.json();

      // 2. Send message linking audioUrl
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          conversationId: selectedConv.id,
          recipientId: otherId,
          messageText: "🎤 Voice message",
          audioUrl: uploadData.audioUrl,
          audioDurationSeconds: uploadData.durationSeconds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed sending voice message record.");
      }

      fetchMessages(selectedConv.id);
      fetchConversations();
    } catch (err: any) {
      alert(err.message || "Could not send voice message.");
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConv || !user) return;
    const otherId =
      selectedConv.participant_one_id === user.id
        ? selectedConv.participant_two_id
        : selectedConv.participant_one_id;

    if (!confirm("Are you sure you want to block this user from contacting you?")) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block_user",
          targetUserId: otherId,
        }),
      });
      const data = await res.json();
      alert(data.blocked ? "User blocked successfully." : "User unblocked.");
    } catch {
      alert("Failed to toggle block.");
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Store className="w-12 h-12 text-primary/40 mb-3" />
        <h2 className="text-xl font-bold mb-2">Marketplace In-App Chat</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Please sign in with your phone number to converse directly with furniture makers and buyers.
        </p>
        <Button onClick={openLogin}>Sign In to Chat</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-card border border-border rounded-3xl flex-1 flex overflow-hidden shadow-sm">
        {/* Conversations & Notifications Sidebar */}
        <div
          className={`w-full md:w-80 border-r border-border flex flex-col bg-muted/20 ${
            selectedConv ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sub-Tabs: Chats | Notifications */}
          <div className="p-3 border-b border-border flex items-center gap-2 bg-background/50">
            <button
              onClick={() => setMainTab("chats")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                mainTab === "chats"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chats ({conversations.length})
            </button>
            <button
              onClick={() => setMainTab("notifications")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all relative ${
                mainTab === "notifications"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Notifications
              {unreadNotifsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              )}
            </button>
          </div>

          {mainTab === "chats" ? (
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {loadingConv ? (
                <div className="p-4">
                  <ChatAndNotificationsSkeleton />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Store className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Inquire on any furniture item or wanted request to begin chatting</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-muted/50 ${
                        isSelected ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        {conv.other_user?.full_name?.slice(0, 1) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {conv.other_user?.full_name || "Furni User"}
                          </span>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message_text || "Started conversation"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* Notifications Panel */
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-2">
              {loadingNotifs ? (
                <div className="p-3">
                  <ChatAndNotificationsSkeleton />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Bell className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      notif.is_read
                        ? "bg-card/50 border-border/40 opacity-80"
                        : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground">{notif.title}</h4>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.link_url && (
                      <Link
                        href={notif.link_url}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-2 hover:underline"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chat Messages Panel */}
        <div
          className={`flex-1 flex flex-col bg-background ${
            !selectedConv ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="md:hidden p-1.5 rounded-full hover:bg-muted"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {selectedConv.other_user?.full_name?.slice(0, 1) || "U"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {selectedConv.other_user?.full_name || "Furni User"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{selectedConv.other_user?.role || "Member"}</span>
                      {selectedConv.other_user?.is_verified && (
                        <span className="flex items-center gap-0.5 text-accent-blue font-semibold">
                          • <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="text-xs text-muted-foreground hover:text-red-500 gap-1"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBlockUser}
                    className="text-xs text-muted-foreground hover:text-red-500 gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" /> Block
                  </Button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                {loadingMsgs ? (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10">
                    No messages yet. Send a friendly message or voice note to begin!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-card border border-border text-foreground rounded-bl-none shadow-sm"
                          }`}
                        >
                          {msg.audio_url ? (
                            <VoicePlayer
                              audioUrl={msg.audio_url}
                              durationSeconds={msg.audio_duration_seconds}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.message_text}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 px-1">
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <span>{msg.is_read ? <CheckCheck className="w-3 h-3 text-accent-blue" /> : <Check className="w-3 h-3" />}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form with Voice Recorder & Text */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
                <VoiceRecorder onAudioReady={handleSendVoiceMessage} disabled={sending} />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type message or record voice..."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" disabled={sending || !inputText.trim()} className="gap-2">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Store className="w-12 h-12 opacity-20 mb-3" />
              <h3 className="font-semibold text-foreground">Select a conversation</h3>
              <p className="text-xs max-w-xs mt-1">
                Choose a conversation on the left to chat with furniture artisans, suppliers, and buyers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {selectedConv && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportType="message"
          targetUserId={
            selectedConv.participant_one_id === user.id
              ? selectedConv.participant_two_id
              : selectedConv.participant_one_id
          }
          targetTitleOrName={selectedConv.other_user?.full_name}
        />
      )}
    </div>
  );
}
