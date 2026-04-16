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
import { Loader2, Sparkles, RotateCcw, CheckCircle2, Layers, Trash2 } from "lucide-react";

const subjects = [
  { value: "mathematics", label: "Mathematics", emoji: "📐" },
  { value: "science", label: "Science", emoji: "🔬" },
  { value: "coding", label: "Coding / DSA", emoji: "💻" },
  { value: "electronics", label: "Electronics", emoji: "⚡" },
  { value: "dbms", label: "DBMS", emoji: "🗄️" },
  { value: "os", label: "Operating Systems", emoji: "🖥️" },
  { value: "other", label: "Other", emoji: "📚" },
];

type FlashcardData = { front: string; back: string };

const Flashcards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<FlashcardData[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "review">("generate");

  const { data: savedCards } = useQuery({
    queryKey: ["flashcards", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("flashcards").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const generateFlashcards = async () => {
    if (!subject || !topic.trim()) {
      toast.error("Please select a subject and enter a topic");
      return;
    }
    setGenerating(true);
    setGeneratedCards([]);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Generate exactly 8 flashcards for the topic "${topic}" in "${subject}". Return ONLY a JSON array, no other text. Each item must have "front" (question) and "back" (concise answer). Example: [{"front":"What is...","back":"It is..."}]`,
            },
          ],
          type: "flashcards",
        },
      });

      if (error) throw error;

      // Parse the streamed response - try to extract JSON array
      const text = typeof data === "string" ? data : JSON.stringify(data);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not parse flashcards");

      const cards: FlashcardData[] = JSON.parse(jsonMatch[0]);
      setGeneratedCards(cards);
      setCurrentCard(0);
      setFlipped(false);

      // Save to database
      if (user && cards.length > 0) {
        const inserts = cards.map(c => ({
          user_id: user.id,
          subject,
          topic: topic.trim(),
          front: c.front,
          back: c.back,
          deck_name: topic.trim(),
        }));
        await supabase.from("flashcards").insert(inserts);
        queryClient.invalidateQueries({ queryKey: ["flashcards", user.id] });
        toast.success(`${cards.length} flashcards generated and saved!`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate flashcards");
    } finally {
      setGenerating(false);
    }
  };

  const toggleMastered = async (id: string, current: boolean) => {
    await supabase.from("flashcards").update({ is_mastered: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["flashcards", user?.id] });
  };

  const deleteCard = async (id: string) => {
    await supabase.from("flashcards").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["flashcards", user?.id] });
  };

  const reviewCards = savedCards?.filter(c => !c.is_mastered) || [];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">🧠 Flashcard Generator</h1>
          <p className="text-muted-foreground">AI creates flashcards for active recall practice</p>
        </motion.div>

        <div className="flex gap-2 mb-6 justify-center">
          <Button variant={activeTab === "generate" ? "default" : "outline"} onClick={() => setActiveTab("generate")}>
            <Sparkles className="w-4 h-4 mr-2" /> Generate
          </Button>
          <Button variant={activeTab === "review" ? "default" : "outline"} onClick={() => setActiveTab("review")}>
            <Layers className="w-4 h-4 mr-2" /> Review ({reviewCards.length})
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "generate" ? (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Sorting Algorithms, SQL Joins..." />
                  </div>
                </div>
                <Button onClick={generateFlashcards} disabled={generating} variant="hero" className="w-full">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Flashcards</>}
                </Button>
              </Card>

              {generatedCards.length > 0 && (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    Card {currentCard + 1} of {generatedCards.length} — Tap to flip
                  </div>
                  <div
                    onClick={() => setFlipped(!flipped)}
                    className="cursor-pointer perspective-1000"
                  >
                    <motion.div
                      className="relative w-full min-h-[200px]"
                      animate={{ rotateY: flipped ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <Card className={`absolute inset-0 p-8 flex items-center justify-center text-center ${flipped ? "[backface-visibility:hidden] opacity-0" : ""}`}>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">QUESTION</p>
                          <p className="text-lg font-medium text-foreground">{generatedCards[currentCard]?.front}</p>
                        </div>
                      </Card>
                      <Card className={`absolute inset-0 p-8 flex items-center justify-center text-center gradient-hero ${!flipped ? "[backface-visibility:hidden] opacity-0" : ""}`} style={{ transform: "rotateY(180deg)" }}>
                        <div>
                          <p className="text-xs text-primary-foreground/70 mb-2">ANSWER</p>
                          <p className="text-lg font-medium text-primary-foreground">{generatedCards[currentCard]?.back}</p>
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false); }} disabled={currentCard === 0}>
                      Previous
                    </Button>
                    <Button variant="outline" onClick={() => { setFlipped(false); }}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Flip
                    </Button>
                    <Button variant="hero" onClick={() => { setCurrentCard(Math.min(generatedCards.length - 1, currentCard + 1)); setFlipped(false); }} disabled={currentCard === generatedCards.length - 1}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {reviewCards.length > 0 ? (
                reviewCards.map(card => (
                  <Card key={card.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">{card.front}</p>
                        <p className="text-sm text-muted-foreground">{card.back}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.subject} • {card.topic}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => toggleMastered(card.id, card.is_mastered)} title="Mark as mastered">
                          <CheckCircle2 className={`w-4 h-4 ${card.is_mastered ? "text-primary" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCard(card.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">All cards mastered or none saved yet!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Flashcards;
