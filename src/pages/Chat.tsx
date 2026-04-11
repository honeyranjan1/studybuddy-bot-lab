import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, User, Sparkles, BookOpen, Calculator, FlaskConical, Code, Mic, MicOff, Volume2, VolumeX, ImagePlus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
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
      content: "Hi there! 👋 I'm your AI tutor. I'm here to help you learn anything — from math and science to coding and languages. You can also upload images of your questions or use voice chat! What would you like to learn today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Text-to-speech for assistant messages
  const speakText = useCallback((text: string) => {
    if (!ttsEnabled) return;
    const clean = text.replace(/[#*_`~\[\]()>!|]/g, "").replace(/\n+/g, ". ");
    if (!clean.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // Speech recognition
  const toggleListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in your browser. Try Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access.");
      } else {
        toast.error("Voice recognition error. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPendingImage(base64);
      setPendingImagePreview(base64);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = () => {
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !pendingImage) || isTyping) return;

    const displayText = text.trim() || (pendingImage ? "📷 [Image uploaded — please analyze this]" : "");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayText,
      imageUrl: pendingImagePreview || undefined,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Build API message content
    let apiContent: string | ContentPart[];
    if (pendingImage) {
      const parts: ContentPart[] = [];
      if (text.trim()) {
        parts.push({ type: "text", text: text.trim() });
      } else {
        parts.push({ type: "text", text: "Please analyze this image and help me understand it. If it contains a question or problem, solve it step by step." });
      }
      parts.push({ type: "image_url", image_url: { url: pendingImage } });
      apiContent = parts;
    } else {
      apiContent = text.trim();
    }

    setPendingImage(null);
    setPendingImagePreview(null);

    // Build API messages history (text only for previous, multimodal for current)
    const apiMessages = updatedMessages.map((m, i) => {
      if (i === updatedMessages.length - 1) {
        return { role: m.role, content: apiContent };
      }
      return { role: m.role, content: m.content };
    });

    let assistantContent = "";

    try {
      await streamChat({
        messages: apiMessages,
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
        onDone: () => {
          setIsTyping(false);
          if (ttsEnabled && assistantContent) {
            speakText(assistantContent);
          }
        },
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-semibold text-foreground">AI Tutor</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Online • Voice & Image enabled
                </p>
              </div>
            </div>
            <Button
              variant={ttsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled) window.speechSynthesis.cancel();
                toast.success(ttsEnabled ? "Voice responses disabled" : "Voice responses enabled");
              }}
              className="gap-1.5"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{ttsEnabled ? "Voice On" : "Voice Off"}</span>
            </Button>
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
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Uploaded question" className="max-w-full max-h-48 rounded-lg mb-2 object-contain" />
                    )}
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

        {/* Pending image preview */}
        {pendingImagePreview && (
          <div className="px-4 py-2 border-t border-border bg-card/50">
            <div className="relative inline-block">
              <img src={pendingImagePreview} alt="Preview" className="h-20 rounded-lg object-contain border border-border" />
              <button
                onClick={removePendingImage}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-border bg-card/50 backdrop-blur px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isTyping}
              className="rounded-xl shrink-0"
              title="Upload image"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleListening}
              disabled={isTyping}
              className="rounded-xl shrink-0"
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask me anything..."}
              className="flex-1 rounded-xl bg-background border-border"
              disabled={isTyping}
            />
            <Button type="submit" variant="hero" size="icon" disabled={(!input.trim() && !pendingImage) || isTyping} className="rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Voice chat • Image analysis • Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
