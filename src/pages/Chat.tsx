import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Brain, User, Sparkles, BookOpen, Calculator, FlaskConical, Code,
  Mic, MicOff, Volume2, VolumeX, ImagePlus, X, Plus, MessageSquare, Trash2,
  PanelLeftClose, PanelLeftOpen, Pencil, Check, Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/studybuddy-logo.png";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

type Session = {
  id: string;
  title: string;
  last_message_at: string;
};

const quickTopics = [
  { label: "Math help", icon: Calculator, prompt: "Help me with a math problem step by step" },
  { label: "Explain concept", icon: FlaskConical, prompt: "Explain a complex science concept simply" },
  { label: "Improve writing", icon: BookOpen, prompt: "Help me improve my writing skills" },
  { label: "Code review", icon: Code, prompt: "Review this code and suggest improvements" },
];

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi there! 👋 I'm **StudyBuddy AI**, your personal tutor. Ask me anything — math, science, coding, writing — or upload an image of a question. How can I help today?",
};

const groupSessions = (sessions: Session[]) => {
  const now = Date.now();
  const day = 86400000;
  const groups: Record<string, Session[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  sessions.forEach(s => {
    const diff = now - new Date(s.last_message_at).getTime();
    if (diff < day) groups.Today.push(s);
    else if (diff < 2 * day) groups.Yesterday.push(s);
    else if (diff < 7 * day) groups["Previous 7 days"].push(s);
    else groups.Older.push(s);
  });
  return groups;
};

const Chat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat sessions (with optional content search)
  const { data: sessions = [] } = useQuery({
    queryKey: ["chatSessions", user?.id, searchQuery],
    queryFn: async () => {
      if (!user) return [];
      const q = searchQuery.trim();
      if (!q) {
        const { data } = await supabase
          .from("chat_sessions")
          .select("id, title, last_message_at")
          .eq("user_id", user.id)
          .order("last_message_at", { ascending: false });
        return (data || []) as Session[];
      }
      // Search by title OR by message content
      const [{ data: byTitle }, { data: byContent }] = await Promise.all([
        supabase.from("chat_sessions").select("id, title, last_message_at")
          .eq("user_id", user.id).ilike("title", `%${q}%`),
        supabase.from("chat_messages").select("session_id")
          .eq("user_id", user.id).ilike("content", `%${q}%`).limit(200),
      ]);
      const idsFromContent = Array.from(new Set((byContent || []).map(m => m.session_id)));
      let extra: Session[] = [];
      if (idsFromContent.length) {
        const { data } = await supabase.from("chat_sessions")
          .select("id, title, last_message_at")
          .in("id", idsFromContent);
        extra = (data || []) as Session[];
      }
      const merged = new Map<string, Session>();
      [...(byTitle || []), ...extra].forEach(s => merged.set(s.id, s as Session));
      return Array.from(merged.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
    enabled: !!user,
  });

  // Load messages for the active session
  useEffect(() => {
    if (!activeSessionId || !user) {
      setMessages([WELCOME]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, role, content, image_url")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true });
      if (data && data.length) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          imageUrl: m.image_url || undefined,
        })));
      } else {
        setMessages([WELCOME]);
      }
    })();
  }, [activeSessionId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const speakText = useCallback((text: string) => {
    if (!ttsEnabled) return;
    const clean = text.replace(/[#*_`~\[\]()>!|]/g, "").replace(/\n+/g, ". ");
    if (!clean.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Speech recognition not supported. Try Chrome."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") toast.error("Microphone access denied.");
      else toast.error("Voice recognition error.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF supported."); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPendingImage(base64);
      setPendingImagePreview(base64);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([WELCOME]);
    setInput("");
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("session_id", id);
    await supabase.from("chat_sessions").delete().eq("id", id);
    if (activeSessionId === id) startNewChat();
    queryClient.invalidateQueries({ queryKey: ["chatSessions", user.id] });
    toast.success("Chat deleted");
  };

  const startRename = (s: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(s.id);
    setRenameValue(s.title);
  };

  const saveRename = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!renamingId || !user || !renameValue.trim()) { setRenamingId(null); return; }
    await supabase.from("chat_sessions").update({ title: renameValue.trim() }).eq("id", renamingId);
    queryClient.invalidateQueries({ queryKey: ["chatSessions", user.id] });
    setRenamingId(null);
  };

  const generateTitle = async (sessionId: string, userMsg: string, assistantMsg: string) => {
    try {
      let title = "";
      await streamChat({
        messages: [{
          role: "user",
          content: `Generate a concise 4-6 word title (no quotes, no punctuation at the end, Title Case) for this conversation. Reply with ONLY the title.\n\nUser: ${userMsg.slice(0, 400)}\n\nAssistant: ${assistantMsg.slice(0, 400)}`,
        }],
        onDelta: (chunk) => { title += chunk; },
        onDone: () => {},
      });
      const clean = title.replace(/["']/g, "").replace(/[.!?]+$/, "").trim().split("\n")[0].slice(0, 60);
      if (clean && user) {
        await supabase.from("chat_sessions").update({ title: clean }).eq("id", sessionId);
        queryClient.invalidateQueries({ queryKey: ["chatSessions", user.id] });
      }
    } catch (e) {
      console.error("Title generation failed:", e);
    }
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !pendingImage) || isTyping || !user) return;

    const displayText = text.trim() || (pendingImage ? "📷 [Image — please analyze]" : "");
    const userMsg: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: displayText,
      imageUrl: pendingImagePreview || undefined,
    };

    // Create session if needed
    let sessionId = activeSessionId;
    if (!sessionId) {
      const title = (text.trim() || "New chat").slice(0, 50);
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error || !newSession) { toast.error("Failed to create chat"); return; }
      sessionId = newSession.id;
      setActiveSessionId(sessionId);
      queryClient.invalidateQueries({ queryKey: ["chatSessions", user.id] });
    }

    const baseMessages = messages[0]?.id === "welcome" ? [] : messages;
    const updatedMessages = [...baseMessages, userMsg];
    const isFirstMessageInSession = baseMessages.length === 0;
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Persist user message (without base64 image to avoid huge rows; store preview only when reasonably sized)
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: user.id,
      role: "user",
      content: displayText,
      image_url: pendingImagePreview && pendingImagePreview.length < 500_000 ? pendingImagePreview : null,
    });

    // Build API content
    let apiContent: string | ContentPart[];
    if (pendingImage) {
      const parts: ContentPart[] = [
        { type: "text", text: text.trim() || "Please analyze this image and help me understand it. If it contains a question, solve it step by step." },
        { type: "image_url", image_url: { url: pendingImage } },
      ];
      apiContent = parts;
    } else {
      apiContent = text.trim();
    }

    setPendingImage(null);
    setPendingImagePreview(null);

    const apiMessages = updatedMessages.map((m, i) =>
      i === updatedMessages.length - 1
        ? { role: m.role, content: apiContent }
        : { role: m.role, content: m.content }
    );

    let assistantContent = "";
    const streamId = "s-" + Date.now();

    try {
      await streamChat({
        messages: apiMessages,
        onDelta: chunk => {
          assistantContent += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.id === streamId) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
            }
            return [...prev, { id: streamId, role: "assistant", content: assistantContent }];
          });
        },
        onDone: async () => {
          setIsTyping(false);
          if (assistantContent) {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              user_id: user.id,
              role: "assistant",
              content: assistantContent,
            });
            await supabase.from("chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", sessionId);
            queryClient.invalidateQueries({ queryKey: ["chatSessions", user.id] });
            if (ttsEnabled) speakText(assistantContent);

            // Auto-generate a smart title from the first exchange
            if (isFirstMessageInSession && text.trim()) {
              generateTitle(sessionId!, text.trim(), assistantContent);
            }
          }
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI response");
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const grouped = groupSessions(sessions);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-bg-base font-sans">
      {/* Conversation history sidebar */}
      <aside
        className={`${historyOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0`}
      >
        <div className="w-72 h-full flex flex-col p-3 gap-3">
          {/* Sidebar card */}
          <div className="flex-1 flex flex-col rounded-3xl bg-white/70 backdrop-blur-xl border border-black/5 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-black/5">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-[#8e8e8e] mb-3">conversations</p>
              <button
                onClick={startNewChat}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white rounded-full px-4 py-2.5 text-sm font-medium hover:bg-black transition-colors"
              >
                <Plus className="w-4 h-4" /> new chat
              </button>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8e8e8e]" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="search chats..."
                  className="w-full pl-9 pr-8 h-9 text-xs rounded-full bg-bg-base border border-transparent focus:border-black/10 outline-none placeholder:text-[#8e8e8e]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e8e] hover:text-[#1a1a1a]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {sessions.length === 0 ? (
                <div className="text-center py-14 px-3">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-bg-base flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#8e8e8e]" />
                  </div>
                  <p className="text-xs text-[#4a4a4a] lowercase">
                    {searchQuery ? "no matches found" : "no conversations yet"}
                  </p>
                  <p className="text-[11px] text-[#8e8e8e] mt-1">
                    {searchQuery ? "try a different search" : "start chatting to save history"}
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([label, items]) =>
                  items.length > 0 && (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#8e8e8e] font-medium px-2 mb-2">{label}</p>
                      <div className="space-y-1">
                        {items.map(s => {
                          const active = s.id === activeSessionId;
                          const isRenaming = renamingId === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => !isRenaming && setActiveSessionId(s.id)}
                              className={`group flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer text-sm transition-all ${
                                active
                                  ? "bg-[#1a1a1a] text-white"
                                  : "text-[#1a1a1a]/80 hover:bg-bg-base"
                              }`}
                            >
                              {isRenaming ? (
                                <form onSubmit={saveRename} className="flex-1 flex gap-1" onClick={e => e.stopPropagation()}>
                                  <Input
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    autoFocus
                                    onBlur={saveRename}
                                    className="h-7 text-xs px-2 rounded-full"
                                  />
                                  <button type="submit" className="text-brand-green"><Check className="w-3.5 h-3.5" /></button>
                                </form>
                              ) : (
                                <>
                                  <span className="flex-1 truncate lowercase">{s.title}</span>
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0 transition-opacity">
                                    <button
                                      onClick={e => startRename(s, e)}
                                      className={`p-1 rounded-full ${active ? "hover:bg-white/10" : "hover:bg-white"}`}
                                      title="Rename"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={e => deleteSession(s.id, e)}
                                      className={`p-1 rounded-full ${active ? "hover:bg-white/10" : "hover:bg-white text-[#8e8e8e] hover:text-destructive"}`}
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating top bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setHistoryOpen(o => !o)}
              className="h-10 w-10 rounded-full bg-white/70 backdrop-blur-xl border border-black/5 shadow-soft flex items-center justify-center text-[#1a1a1a] hover:bg-white transition"
              title={historyOpen ? "Hide history" : "Show history"}
            >
              {historyOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="pointer-events-auto inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-xl border border-black/5 shadow-soft rounded-full pl-1.5 pr-4 py-1.5">
              <div className="w-7 h-7 rounded-full bg-white overflow-hidden shrink-0">
                <img src={logo} alt="StudyBuddy" className="w-full h-full object-contain" />
              </div>
              <span className="font-display text-sm text-[#1a1a1a] lowercase">studybuddy tutor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            </div>
          </div>
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled) window.speechSynthesis.cancel();
              toast.success(ttsEnabled ? "Voice responses off" : "Voice responses on");
            }}
            className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 h-10 text-xs font-medium transition ${
              ttsEnabled
                ? "bg-brand-green text-[#1a1a1a] shadow-glow"
                : "bg-white/70 backdrop-blur-xl border border-black/5 text-[#1a1a1a] hover:bg-white"
            }`}
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="lowercase">voice {ttsEnabled ? "on" : "off"}</span>
          </button>
        </div>

        {/* Messages / Editorial hero */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-24">
          {messages.length === 1 && messages[0].id === "welcome" ? (
            /* Editorial empty-state hero */
            <div className="max-w-4xl mx-auto px-6 md:px-10 pt-12 pb-8">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e] mb-6"
              >
                ai tutor · always on
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="font-display font-medium tracking-tight text-[42px] md:text-[68px] leading-[1.02] text-[#1a1a1a]"
              >
                hey there,
                <br />
                <span className="text-[#8e8e8e]">what shall we</span>
                <br />
                <span className="text-[#8e8e8e]">learn</span>{" "}
                <span className="text-[#1a1a1a]">today?</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-6 text-[#4a4a4a] max-w-xl leading-relaxed"
              >
                Ask a question, drop an image of a problem, or speak your mind. StudyBuddy explains, quizzes, and coaches — one step at a time.
              </motion.p>

              {/* Quick starts as editorial pills */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-10"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8e8e8e] mb-4">try one of these</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {quickTopics.map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <motion.button
                        key={t.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        onClick={() => sendMessage(t.prompt)}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 hover:border-[#1a1a1a]/20 hover:shadow-soft text-left transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] text-white group-hover:bg-brand-green group-hover:text-[#1a1a1a] flex items-center justify-center transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] lowercase">{t.label}</p>
                          <p className="text-xs text-[#6a6a6a] truncate">{t.prompt}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[88%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                        msg.role === "assistant" ? "bg-white shadow-soft" : "bg-[#1a1a1a] text-white"
                      }`}>
                        {msg.role === "assistant"
                          ? <img src={logo} alt="AI" className="w-full h-full object-contain" />
                          : <User className="w-4 h-4" />
                        }
                      </div>
                      <div className={`rounded-3xl px-5 py-3 ${
                        msg.role === "user"
                          ? "bg-[#1a1a1a] text-white rounded-tr-md"
                          : "bg-white border border-black/5 text-[#1a1a1a] rounded-tl-md shadow-soft"
                      }`}>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="Uploaded" className="max-w-full max-h-56 rounded-xl mb-2 object-contain" />
                        )}
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-display prose-headings:text-[#1a1a1a]">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-white shadow-soft overflow-hidden shrink-0">
                    <img src={logo} alt="AI" className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-white border border-black/5 rounded-3xl rounded-tl-md px-5 py-3.5 shadow-soft">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#1a1a1a]/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#1a1a1a]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#1a1a1a]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Pending image */}
        {pendingImagePreview && (
          <div className="px-4 py-2">
            <div className="max-w-3xl mx-auto">
              <div className="relative inline-block">
                <img src={pendingImagePreview} alt="Preview" className="h-20 rounded-2xl object-contain border border-black/5 shadow-soft" />
                <button
                  onClick={() => { setPendingImage(null); setPendingImagePreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center shadow-soft"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editorial composer capsule */}
        <div className="px-4 md:px-6 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 bg-white border border-black/5 rounded-full shadow-soft pl-2 pr-2 py-2 focus-within:border-[#1a1a1a]/20 transition-colors"
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping}
                className="h-9 w-9 rounded-full text-[#4a4a4a] hover:bg-bg-base flex items-center justify-center transition shrink-0 disabled:opacity-40"
                title="Upload image"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleListening}
                disabled={isTyping}
                className={`h-9 w-9 rounded-full flex items-center justify-center transition shrink-0 disabled:opacity-40 ${
                  isListening ? "bg-destructive text-white" : "text-[#4a4a4a] hover:bg-bg-base"
                }`}
                title={isListening ? "Stop" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isListening ? "listening..." : "message studybuddy..."}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#8e8e8e] px-2 h-9"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !pendingImage) || isTyping}
                className="h-9 w-9 rounded-full bg-[#1a1a1a] text-white hover:bg-black flex items-center justify-center transition shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-[#8e8e8e] text-center mt-3 flex items-center justify-center gap-1.5 lowercase">
              <Sparkles className="w-3 h-3" />
              conversations saved automatically · voice & image supported
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

