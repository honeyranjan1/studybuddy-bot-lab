import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, XCircle, Loader2, Play, RotateCcw, Trophy, ArrowRight, Sparkles,
} from "lucide-react";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type QuizState = "setup" | "loading" | "playing" | "review" | "results";

const subjects = [
  { value: "mathematics", label: "Mathematics", emoji: "📐" },
  { value: "science", label: "Science", emoji: "🔬" },
  { value: "english", label: "English", emoji: "📝" },
  { value: "coding", label: "Coding", emoji: "💻" },
  { value: "history", label: "History", emoji: "📜" },
  { value: "geography", label: "Geography", emoji: "🌍" },
];

const difficulties = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const Quiz = () => {
  const { user } = useAuth();
  const [state, setState] = useState<QuizState>("setup");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateQuiz = async () => {
    if (!subject || !topic.trim()) {
      toast.error("Please select a subject and enter a topic");
      return;
    }
    setState("loading");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ subject, topic, numQuestions: 5, difficulty }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate quiz");
      }

      const data = await resp.json();
      setQuestions(data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setSelectedAnswer("");
      setShowExplanation(false);
      setState("playing");
    } catch (e: any) {
      toast.error(e.message);
      setState("setup");
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer === "") return;
    const answerIndex = parseInt(selectedAnswer);
    setAnswers((prev) => [...prev, answerIndex]);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer("");
    if (currentQ + 1 < questions.length) {
      setCurrentQ((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const finalAnswers = [...answers, parseInt(selectedAnswer)];
    const correct = finalAnswers.filter((a, i) => a === questions[i].correctIndex).length;
    const score = Math.round((correct / questions.length) * 100);

    setState("results");

    if (user) {
      try {
        await supabase.from("quiz_results").insert({
          user_id: user.id,
          subject,
          topic,
          score,
          total_questions: questions.length,
          correct_answers: correct,
          questions: questions as any,
        });

        // Update streak/XP
        const { data: streak } = await supabase
          .from("learning_streaks")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const today = new Date().toISOString().split("T")[0];
        const xpGained = score >= 80 ? 50 : score >= 60 ? 30 : 15;

        if (streak) {
          const lastDate = streak.last_activity_date;
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          let newStreak = streak.current_streak;
          if (lastDate === yesterday) newStreak += 1;
          else if (lastDate !== today) newStreak = 1;

          await supabase.from("learning_streaks").update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_activity_date: today,
            total_xp: streak.total_xp + xpGained,
          }).eq("user_id", user.id);
        } else {
          await supabase.from("learning_streaks").insert({
            user_id: user.id,
            current_streak: 1,
            last_activity_date: today,
            total_xp: xpGained,
          });
        }
      } catch (e) {
        console.error("Failed to save quiz results:", e);
      }
    }
  };

  const correctCount = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const resetQuiz = () => {
    setState("setup");
    setQuestions([]);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedAnswer("");
    setShowExplanation(false);
    setTopic("");
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <AnimatePresence mode="wait">
          {state === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">Take a Quiz 🎯</h1>
                <p className="text-muted-foreground">AI generates personalized MCQ questions for you</p>
              </div>

              <Card className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Topic</Label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Fractions, Newton's Laws, Python loops..."
                    className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Difficulty</Label>
                  <div className="flex gap-2">
                    {difficulties.map((d) => (
                      <Button
                        key={d.value}
                        variant={difficulty === d.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDifficulty(d.value)}
                        className="flex-1"
                      >
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button onClick={generateQuiz} className="w-full" variant="hero" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Quiz
                </Button>
              </Card>
            </motion.div>
          )}

          {state === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h2 className="text-xl font-display font-semibold text-foreground mb-2">Generating your quiz...</h2>
              <p className="text-muted-foreground">AI is creating personalized questions</p>
            </motion.div>
          )}

          {state === "playing" && questions[currentQ] && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
                  <span className="text-sm font-medium text-primary">{subject} • {difficulty}</span>
                </div>
                <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />
              </div>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">{questions[currentQ].question}</h2>

                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showExplanation}>
                  <div className="space-y-3">
                    {questions[currentQ].options.map((opt, i) => {
                      const isCorrect = i === questions[currentQ].correctIndex;
                      const isSelected = parseInt(selectedAnswer) === i;
                      let borderClass = "border-border";
                      if (showExplanation) {
                        if (isCorrect) borderClass = "border-green-500 bg-green-500/10";
                        else if (isSelected && !isCorrect) borderClass = "border-destructive bg-destructive/10";
                      }

                      return (
                        <Label
                          key={i}
                          htmlFor={`opt-${i}`}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${borderClass} ${!showExplanation && isSelected ? "border-primary bg-primary/5" : ""}`}
                        >
                          <RadioGroupItem value={i.toString()} id={`opt-${i}`} />
                          <span className="text-sm text-foreground flex-1">{opt}</span>
                          {showExplanation && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive" />}
                        </Label>
                      );
                    })}
                  </div>
                </RadioGroup>

                {showExplanation && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-secondary">
                    <p className="text-sm font-medium text-foreground mb-1">💡 Explanation</p>
                    <p className="text-sm text-muted-foreground">{questions[currentQ].explanation}</p>
                  </motion.div>
                )}

                <div className="mt-6 flex gap-3">
                  {!showExplanation ? (
                    <Button onClick={submitAnswer} disabled={selectedAnswer === ""} className="w-full" variant="hero">
                      Submit Answer
                    </Button>
                  ) : (
                    <Button onClick={nextQuestion} className="w-full" variant="hero">
                      {currentQ + 1 < questions.length ? (
                        <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
                      ) : (
                        <>See Results <Trophy className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {state === "results" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-8 text-center">
                <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">Quiz Complete!</h1>
                <p className="text-muted-foreground mb-6">{subject} — {topic}</p>

                <div className="text-5xl font-display font-bold text-primary mb-2">{score}%</div>
                <p className="text-muted-foreground mb-8">
                  {correctCount} out of {questions.length} correct
                </p>

                <div className="space-y-3 mb-8 text-left">
                  {questions.map((q, i) => {
                    const isCorrect = answers[i] === q.correctIndex;
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-sm font-medium text-foreground">{q.question}</p>
                            {!isCorrect && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Your answer: {q.options[answers[i]]} → Correct: {q.options[q.correctIndex]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button onClick={resetQuiz} variant="outline" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" /> New Quiz
                  </Button>
                  <Button onClick={() => { setCurrentQ(0); setAnswers([]); setSelectedAnswer(""); setShowExplanation(false); setState("playing"); }} variant="hero" className="flex-1">
                    <Play className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
