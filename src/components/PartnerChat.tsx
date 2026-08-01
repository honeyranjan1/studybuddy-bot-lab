import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pill } from "@/components/ui/pill";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Send, Loader2, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

interface PartnerChatProps {
  partnerUserId: string;
  partnerLabel: string;
  open: boolean;
  onClose: () => void;
}

const PartnerChat = ({ partnerUserId, partnerLabel, open, onClose }: PartnerChatProps) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  // Resolve (or create) the conversation between the two users
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setMessages([]);
      setConversationId(null);

      const [userA, userB] = [user.id, partnerUserId].sort();

      const { data: existing, error: findError } = await supabase
        .from("partner_conversations")
        .select("id")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();

      if (findError) {
        if (!cancelled) { toast.error("Could not open the chat."); setLoading(false); }
        return;
      }

      let convId = existing?.id ?? null;

      if (!convId) {
        const { data: created, error: createError } = await supabase
          .from("partner_conversations")
          .insert({ user_a: userA, user_b: userB })
          .select("id")
          .single();
        if (createError || !created) {
          if (!cancelled) { toast.error("Could not start the chat."); setLoading(false); }
          return;
        }
        convId = created.id;
      }

      const { data: history, error: msgError } = await supabase
        .from("partner_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (msgError) {
        if (!cancelled) { toast.error("Could not load messages."); setLoading(false); }
        return;
      }

      if (cancelled) return;
      setConversationId(convId);
      setMessages((history as Message[]) ?? []);
      setLoading(false);
      scrollToBottom();
      inputRef.current?.focus();
    };

    init();
    return () => { cancelled = true; };
  }, [open, user, partnerUserId, scrollToBottom]);

  // Realtime updates
  useEffect(() => {
    if (!open || !conversationId) return;

    const channel = supabase
      .channel(`partner-chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partner_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          scrollToBottom();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, conversationId, scrollToBottom]);

  const send = async () => {
    const content = text.trim();
    if (!content || !conversationId || !user || sending) return;
    setSending(true);
    setText("");

    const { data, error } = await supabase
      .from("partner_messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, content })
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Message failed to send.");
      setText(content);
    } else {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
      await supabase
        .from("partner_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      scrollToBottom();
    }
    setSending(false);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#1a1a1a]/25 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass w-full sm:max-w-lg h-[85vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-display text-lg leading-none text-[#1a1a1a] lowercase">{partnerLabel}</p>
                  <p className="text-[11px] text-[#8e8e8e] mt-1 lowercase">coordinate your study sessions</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="close chat" className="p-2 rounded-full hover:bg-[#1a1a1a]/5 transition">
                <X className="w-4 h-4 text-[#6a6a6a]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8e8e8e]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <p className="font-display text-2xl text-[#1a1a1a] lowercase">say hello</p>
                  <p className="text-sm text-[#8e8e8e] mt-2">
                    start the conversation and plan your next study session together.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                          mine
                            ? "bg-[#1a1a1a] text-white rounded-br-md"
                            : "bg-white/70 border border-white/60 text-[#1a1a1a] rounded-bl-md"
                        }`}
                      >
                        {m.content}
                        <span className={`block text-[10px] mt-1 ${mine ? "text-white/50" : "text-[#8e8e8e]"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-[#1a1a1a]/10 flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="write a message..."
                rows={1}
                disabled={loading}
                className="resize-none min-h-[46px] max-h-32 rounded-2xl bg-white/70 border-white/60 backdrop-blur-xl"
              />
              <Pill
                variant="solid"
                className="px-4 h-[46px]"
                onClick={send}
                disabled={loading || sending || !text.trim()}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Pill>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PartnerChat;
