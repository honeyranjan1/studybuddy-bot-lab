import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, User, Sparkles, BookOpen, Calculator, FlaskConical, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickTopics = [
  { label: "Math", icon: Calculator, prompt: "Help me with math problems" },
  { label: "Science", icon: FlaskConical, prompt: "Explain a science concept" },
  { label: "English", icon: BookOpen, prompt: "Help me improve my writing" },
  { label: "Coding", icon: Code, prompt: "Teach me programming" },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi there! 👋 I'm your AI tutor. I'm here to help you learn anything — from math and science to coding and languages. What would you like to learn today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    let assistantContent = "";

    try {
      await streamChat({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id.startsWith("stream-")) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
            }
            return [...prev, { id: "stream-" + Date.now(), role: "assistant", content: assistantContent }];
          });
        },
        onDone: () => setIsTyping(false),
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI response");
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <div className="px-4 py-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-foreground">AI Tutor</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Online • Ready to help
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "gradient-hero" : "bg-secondary"}`}>
                    {msg.role === "assistant" ? <Brain className="w-4 h-4 text-primary-foreground" /> : <User className="w-4 h-4 text-secondary-foreground" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "gradient-hero text-primary-foreground rounded-tr-md" : "bg-card border border-border text-card-foreground rounded-tl-md"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-2 pt-4">
              {quickTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button key={topic.label} onClick={() => sendMessage(topic.prompt)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:shadow-card transition-all text-sm font-medium text-foreground">
                    <Icon className="w-4 h-4 text-primary" />
                    {topic.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="border-t border-border bg-card/50 backdrop-blur px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." className="flex-1 rounded-xl bg-background border-border" disabled={isTyping} />
            <Button type="submit" variant="hero" size="icon" disabled={!input.trim() || isTyping} className="rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Powered by AI • Responses are for learning purposes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
