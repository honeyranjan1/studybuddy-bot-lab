import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { FileText, Loader2, Sparkles, Star, StarOff, Trash2, BookOpen } from "lucide-react";

const subjects = [
  { value: "mathematics", label: "Mathematics", emoji: "📐" },
  { value: "science", label: "Science", emoji: "🔬" },
  { value: "coding", label: "Coding / DSA", emoji: "💻" },
  { value: "electronics", label: "Electronics", emoji: "⚡" },
  { value: "networking", label: "Networking", emoji: "🌐" },
  { value: "dbms", label: "DBMS", emoji: "🗄️" },
  { value: "os", label: "Operating Systems", emoji: "🖥️" },
  { value: "other", label: "Other", emoji: "📚" },
];

const NotesGenerator = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  const { data: savedNotes } = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("generated_notes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const generateNotes = async () => {
    if (!subject || !topic.trim()) {
      toast.error("Please select a subject and enter a topic");
      return;
    }
    setGenerating(true);
    setGeneratedContent("");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate comprehensive, well-structured study notes on the topic "${topic}" in the subject "${subject}". Include:
1. Introduction / Overview
2. Key Concepts with clear explanations
3. Important formulas or code snippets (if applicable)
4. Examples
5. Summary / Key Takeaways
6. Practice questions (2-3)

Format using markdown with headers, bullet points, and code blocks where appropriate. Make it exam-ready and concise.`,
            },
          ],
          type: "notes",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to generate notes");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setGeneratedContent(content);
            }
          } catch {}
        }
      }

      // Save to database
      if (content && user) {
        await supabase.from("generated_notes").insert({
          user_id: user.id,
          subject,
          topic: topic.trim(),
          content,
        });
        queryClient.invalidateQueries({ queryKey: ["notes", user.id] });
        toast.success("Notes generated and saved!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate notes");
    } finally {
      setGenerating(false);
    }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from("generated_notes").update({ is_favorite: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
  };

  const deleteNote = async (id: string) => {
    await supabase.from("generated_notes").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
    toast.success("Note deleted");
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">📘 Notes Generator</h1>
          <p className="text-muted-foreground">AI generates structured study notes from any topic</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          <Button variant={activeTab === "generate" ? "default" : "outline"} onClick={() => setActiveTab("generate")}>
            <Sparkles className="w-4 h-4 mr-2" /> Generate
          </Button>
          <Button variant={activeTab === "saved" ? "default" : "outline"} onClick={() => setActiveTab("saved")}>
            <BookOpen className="w-4 h-4 mr-2" /> Saved ({savedNotes?.length || 0})
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "generate" ? (
            <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Topic</Label>
                    <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Binary Search Trees, Ohm's Law..." />
                  </div>
                </div>
                <Button onClick={generateNotes} disabled={generating} variant="hero" className="w-full">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Notes</>}
                </Button>
              </Card>

              {generatedContent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                      <FileText className="w-5 h-5 text-primary" />
                      <h2 className="font-display font-semibold text-foreground">Generated Notes</h2>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {savedNotes && savedNotes.length > 0 ? (
                savedNotes.map(note => (
                  <Card key={note.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{note.topic}</h3>
                        <p className="text-xs text-muted-foreground">{note.subject} • {new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleFavorite(note.id, note.is_favorite)}>
                          {note.is_favorite ? <Star className="w-4 h-4 text-accent fill-accent" /> : <StarOff className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto">
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No saved notes yet. Generate your first notes!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotesGenerator;
