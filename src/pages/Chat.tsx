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

  // Load chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["chatSessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id, title, last_message_at")
        .eq("user_id", user!.id)
        .order("last_message_at", { ascending: false });
      return (data || []) as Session[];
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
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Conversation history sidebar */}
      <aside
        className={`${historyOpen ? "w-64" : "w-0"} transition-all duration-200 overflow-hidden border-r border-border bg-card/40 flex-shrink-0`}
      >
        <div className="w-64 h-full flex flex-col">
          <div className="p-3 border-b border-border">
            <Button onClick={startNewChat} variant="default" className="w-full justify-start gap-2 h-9">
              <Plus className="w-4 h-4" /> New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-10 px-3">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Start chatting to save your history</p>
              </div>
            ) : (
              Object.entries(grouped).map(([label, items]) =>
                items.length > 0 && (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 mb-1">{label}</p>
                    <div className="space-y-0.5">
                      {items.map(s => {
                        const active = s.id === activeSessionId;
                        const isRenaming = renamingId === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => !isRenaming && setActiveSessionId(s.id)}
                            className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
                              active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            {isRenaming ? (
                              <form onSubmit={saveRename} className="flex-1 flex gap-1" onClick={e => e.stopPropagation()}>
                                <Input
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  autoFocus
                                  onBlur={saveRename}
                                  className="h-6 text-xs px-1.5"
                                />
                                <button type="submit" className="text-primary"><Check className="w-3.5 h-3.5" /></button>
                              </form>
                            ) : (
                              <>
                                <span className="flex-1 truncate">{s.title}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0 transition-opacity">
                                  <button
                                    onClick={e => startRename(s, e)}
                                    className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground"
                                    title="Rename"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={e => deleteSession(s.id, e)}
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-3 md:px-5 py-3 border-b border-border bg-card/30 backdrop-blur flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setHistoryOpen(o => !o)}
              title={historyOpen ? "Hide history" : "Show history"}
            >
              {historyOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <div className="w-8 h-8 rounded-lg bg-white shadow-soft overflow-hidden shrink-0">
              <img src={logo} alt="StudyBuddy" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-sm text-foreground truncate">StudyBuddy AI Tutor</h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Online • Voice & image enabled
              </p>
            </div>
          </div>
          <Button
            variant={ttsEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled) window.speechSynthesis.cancel();
              toast.success(ttsEnabled ? "Voice responses off" : "Voice responses on");
            }}
            className="h-8"
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline ml-1 text-xs">{ttsEnabled ? "On" : "Off"}</span>
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                      msg.role === "assistant" ? "bg-white shadow-soft" : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.role === "assistant"
                        ? <img src={logo} alt="AI" className="w-full h-full object-contain" />
                        : <User className="w-4 h-4" />
                      }
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border text-card-foreground rounded-tl-sm"
                    }`}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="Uploaded" className="max-w-full max-h-56 rounded-lg mb-2 object-contain" />
                      )}
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:font-display">
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white shadow-soft overflow-hidden shrink-0">
                  <img src={logo} alt="AI" className="w-full h-full object-contain" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            {messages.length === 1 && messages[0].id === "welcome" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-xs text-muted-foreground mb-2 px-1">Quick starts</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickTopics.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.label}
                        onClick={() => sendMessage(t.prompt)}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm text-left transition-all"
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.label}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{t.prompt}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Pending image */}
        {pendingImagePreview && (
          <div className="px-4 py-2 border-t border-border bg-card/30">
            <div className="max-w-3xl mx-auto">
              <div className="relative inline-block">
                <img src={pendingImagePreview} alt="Preview" className="h-20 rounded-lg object-contain border border-border" />
                <button
                  onClick={() => { setPendingImage(null); setPendingImagePreview(null); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border bg-card/30 backdrop-blur px-3 md:px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
              <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isTyping} className="rounded-xl shrink-0 h-10 w-10" title="Upload image">
                <ImagePlus className="w-4 h-4" />
              </Button>
              <Button type="button" variant={isListening ? "destructive" : "outline"} size="icon" onClick={toggleListening} disabled={isTyping} className="rounded-xl shrink-0 h-10 w-10" title={isListening ? "Stop" : "Voice input"}>
                {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Message StudyBuddy AI..."}
                className="flex-1 rounded-xl bg-background h-10"
                disabled={isTyping}
              />
              <Button type="submit" variant="hero" size="icon" disabled={(!input.trim() && !pendingImage) || isTyping} className="rounded-xl shrink-0 h-10 w-10">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Conversations are saved automatically • Voice & image supported
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
