import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowRight, BookOpen, CheckCircle2, Loader2, Play, RotateCcw, Sparkles, Target, Trophy, XCircle,
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
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
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

  const subjectLabel = subjects.find((item) => item.value === subject)?.label ?? "Subject";
  const difficultyLabel = difficulties.find((item) => item.value === difficulty)?.label ?? "Medium";

  return (
    <div className="min-h-screen px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <div className="mx-auto max-w-6xl">
        <AnimatePresence mode="wait">
          {state === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
              <header className="mb-8 flex flex-col justify-between gap-5 md:mb-10 md:flex-row md:items-end">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/65 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl">
                    <Sparkles className="size-3.5 text-accent" /> Quiz studio
                  </div>
                  <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
                    Put your knowledge <span className="text-muted-foreground">to the test.</span>
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Choose a subject, focus on one topic, and set your pace.
                  </p>
                </div>
                <div className="flex items-center gap-3 border-l border-border/70 pl-4 text-sm text-muted-foreground">
                  <span className="font-display text-3xl text-foreground">01</span>
                  <span>Session setup</span>
                </div>
              </header>

              <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
                <Card className="rounded-3xl border-border/60 bg-card/75 p-5 shadow-elevated backdrop-blur-2xl sm:p-8">
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">01 / 03</p>
                      <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">Build your set</h2>
                    </div>
                    <div className="grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent">
                      <BookOpen className="size-5" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <Label className="text-sm font-medium text-foreground">Subject</Label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/65">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((item) => (
                            <SelectItem key={item.value} value={item.value}>{item.emoji} {item.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="quiz-topic" className="text-sm font-medium text-foreground">Topic</Label>
                      <Input
                        id="quiz-topic"
                        value={topic}
                        onChange={(event) => setTopic(event.target.value)}
                        placeholder="e.g., Fractions, Newton’s laws, Python loops"
                        className="h-12 rounded-xl border-border/70 bg-background/65"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-sm font-medium text-foreground">Difficulty</Label>
                      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Quiz difficulty">
                        {difficulties.map((item) => (
                          <Button
                            key={item.value}
                            type="button"
                            variant={difficulty === item.value ? "default" : "outline"}
                            onClick={() => setDifficulty(item.value)}
                            className="h-11 rounded-xl"
                          >
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={generateQuiz} className="h-12 w-full rounded-xl" variant="hero" size="lg">
                      <Sparkles className="mr-2 size-4" /> Create my quiz
                    </Button>
                  </div>
                </Card>

                <Card className="relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl border-foreground/10 bg-foreground p-6 text-background shadow-elevated sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-background/65">Session preview</p>
                    <div className="grid size-10 place-items-center rounded-full border border-background/20 text-accent">
                      <Target className="size-4" />
                    </div>
                  </div>

                  <div className="py-8">
                    <div className="flex items-end gap-3">
                      <span className="font-display text-8xl leading-none">05</span>
                      <span className="pb-2 text-sm text-background/65">questions</span>
                    </div>
                    <div className="mt-6 grid grid-cols-5 gap-2" aria-label="Five questions">
                      {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="h-1.5 rounded-full bg-accent/90" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-background/15 pt-5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-background/60">Subject</span>
                      <span className="truncate text-right">{subject ? `${subjects.find((item) => item.value === subject)?.emoji ?? ""} ${subjectLabel}` : "Not selected"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-background/60">Topic</span>
                      <span className="max-w-[60%] truncate text-right">{topic.trim() || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-background/60">Level</span>
                      <span>{difficultyLabel}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {state === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
              <Card className="w-full rounded-3xl border-border/60 bg-card/75 p-10 text-center shadow-elevated backdrop-blur-2xl">
                <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <Loader2 className="size-7 animate-spin" />
                </div>
                <p className="text-xs text-muted-foreground">{subjectLabel} / {difficultyLabel}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Preparing your questions</h2>
                <p className="mt-2 text-sm text-muted-foreground">A moment while your set comes together.</p>
              </Card>
            </motion.div>
          )}

          {state === "playing" && questions[currentQ] && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-muted-foreground">{subjectLabel} / {difficultyLabel}</p>
                  <h1 className="mt-1 font-display text-3xl font-semibold text-foreground sm:text-4xl">Knowledge check</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{topic}</p>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-border/70 bg-card/65 px-4 py-2 text-sm text-foreground backdrop-blur-xl sm:self-auto">
                  <span className="size-2 rounded-full bg-accent" /> Question {currentQ + 1} of {questions.length}
                </div>
              </header>

              <div className="mb-6 flex items-center gap-4">
                <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5 flex-1" />
                <span className="min-w-12 text-right text-xs text-muted-foreground">{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
              </div>

              <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_0.7fr]">
                <Card className="rounded-3xl border-border/60 bg-card/75 p-5 shadow-elevated backdrop-blur-2xl sm:p-8">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">Question {String(currentQ + 1).padStart(2, "0")}</span>
                    <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs text-secondary-foreground">{difficultyLabel}</span>
                  </div>
                  <h2 className="mb-7 font-display text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                    {questions[currentQ].question}
                  </h2>

                  <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showExplanation}>
                    <div className="space-y-3">
                      {questions[currentQ].options.map((option, index) => {
                        const isCorrect = index === questions[currentQ].correctIndex;
                        const isSelected = parseInt(selectedAnswer) === index;
                        let optionClass = "border-border/60 bg-background/55 hover:border-foreground/20 hover:bg-background/80";
                        if (showExplanation && isCorrect) optionClass = "border-success/50 bg-success/10";
                        else if (showExplanation && isSelected) optionClass = "border-destructive/50 bg-destructive/10";
                        else if (isSelected) optionClass = "border-accent/70 bg-accent/10";

                        return (
                          <Label
                            key={index}
                            htmlFor={`opt-${index}`}
                            className={`flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${optionClass}`}
                          >
                            <RadioGroupItem value={index.toString()} id={`opt-${index}`} />
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">{option}</span>
                            {showExplanation && isCorrect && <CheckCircle2 className="size-5 shrink-0 text-success" />}
                            {showExplanation && isSelected && !isCorrect && <XCircle className="size-5 shrink-0 text-destructive" />}
                          </Label>
                        );
                      })}
                    </div>
                  </RadioGroup>

                  {showExplanation && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-r-xl border-l-2 border-accent bg-secondary/75 p-4">
                      <p className="mb-1 text-sm font-medium text-foreground">Explanation</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{questions[currentQ].explanation}</p>
                    </motion.div>
                  )}

                  <div className="mt-7">
                    {!showExplanation ? (
                      <Button onClick={submitAnswer} disabled={selectedAnswer === ""} className="h-12 w-full rounded-xl" variant="hero">
                        Check answer <ArrowRight className="ml-2 size-4" />
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion} className="h-12 w-full rounded-xl" variant="hero">
                        {currentQ + 1 < questions.length ? (
                          <>Next question <ArrowRight className="ml-2 size-4" /></>
                        ) : (
                          <>See results <Trophy className="ml-2 size-4" /></>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>

                <Card className="rounded-3xl border-border/60 bg-card/65 p-6 shadow-card backdrop-blur-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-foreground">Your progress</p>
                    <Target className="size-4 text-accent" />
                  </div>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="font-display text-5xl leading-none text-foreground">{answers.length}</span>
                    <span className="pb-1 text-sm text-muted-foreground">of {questions.length} answered</span>
                  </div>
                  <Progress value={(answers.length / questions.length) * 100} className="mt-5 h-1.5" />
                  <div className="mt-6 space-y-4 border-t border-border/60 pt-5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Current step</span>
                      <span className="text-foreground">{String(currentQ + 1).padStart(2, "0")} / {questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Answer status</span>
                      <span className="text-right text-foreground">{showExplanation ? "Reviewed" : selectedAnswer ? "Selected" : "Waiting"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Topic</span>
                      <span className="max-w-[60%] truncate text-right text-foreground">{topic}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {state === "results" && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">{subjectLabel} / {difficultyLabel}</p>
                <h1 className="mt-1 font-display text-4xl font-semibold text-foreground sm:text-5xl">Session complete</h1>
                <p className="mt-2 text-muted-foreground">{topic}</p>
              </div>

              <Card className="mb-6 rounded-3xl border-foreground/10 bg-foreground p-6 text-background shadow-elevated backdrop-blur-2xl sm:p-8">
                <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                      <Trophy className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm text-background/65">Your score</p>
                      <p className="mt-1 font-display text-3xl font-semibold">{correctCount} correct answers</p>
                    </div>
                  </div>
                  <div className="font-display text-6xl font-semibold text-accent sm:text-7xl">{score}%</div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-background/15 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-background/60">Questions</p>
                    <p className="mt-1 text-lg">{questions.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-background/60">Correct</p>
                    <p className="mt-1 text-lg">{correctCount} / {questions.length}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-background/60">Topic</p>
                    <p className="mt-1 truncate text-lg">{topic}</p>
                  </div>
                </div>
              </Card>

              <section className="rounded-3xl border border-border/60 bg-card/70 px-5 py-6 shadow-card backdrop-blur-2xl sm:px-8">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <h2 className="font-display text-2xl font-semibold text-foreground">Question review</h2>
                  <span className="text-sm text-muted-foreground">{questions.length} items</span>
                </div>
                <div className="divide-y divide-border/60">
                  {questions.map((question, index) => {
                    const isCorrect = answers[index] === question.correctIndex;
                    return (
                      <div key={index} className="flex items-start gap-3 py-4">
                        {isCorrect ? (
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                        ) : (
                          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-relaxed text-foreground">{question.question}</p>
                          {!isCorrect && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              Your answer: {question.options[answers[index]]} · Correct answer: {question.options[question.correctIndex]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={resetQuiz} variant="outline" className="h-12 flex-1 rounded-xl">
                  <RotateCcw className="mr-2 size-4" /> New quiz
                </Button>
                <Button onClick={() => { setCurrentQ(0); setAnswers([]); setSelectedAnswer(""); setShowExplanation(false); setState("playing"); }} variant="hero" className="h-12 flex-1 rounded-xl">
                  <Play className="mr-2 size-4" /> Try again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
