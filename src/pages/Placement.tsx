import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Briefcase, Code, CheckSquare, Loader2, Sparkles, Target, BookOpen, Trophy,
  GraduationCap, CalendarClock, Brain, TrendingUp, Zap,
} from "lucide-react";

const dsaCategories = [
  {
    name: "Arrays & Strings",
    icon: "🧩",
    topics: ["Two Sum", "Best Time to Buy Sell Stock", "Contains Duplicate", "Product of Array Except Self", "Maximum Subarray", "Longest Substring Without Repeating Characters"],
  },
  {
    name: "Linked Lists",
    icon: "🔗",
    topics: ["Reverse Linked List", "Merge Two Sorted Lists", "Detect Cycle", "Remove Nth Node from End", "Reorder List"],
  },
  {
    name: "Trees & Graphs",
    icon: "🌳",
    topics: ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Level Order Traversal", "Validate BST", "Number of Islands", "Course Schedule"],
  },
  {
    name: "Dynamic Programming",
    icon: "⚡",
    topics: ["Climbing Stairs", "Coin Change", "Longest Increasing Subsequence", "House Robber", "0/1 Knapsack", "Edit Distance"],
  },
  {
    name: "Sorting & Searching",
    icon: "🔍",
    topics: ["Binary Search", "Merge Sort", "Quick Sort", "Search in Rotated Array", "Find Minimum in Rotated Array"],
  },
  {
    name: "Stack & Queue",
    icon: "📚",
    topics: ["Valid Parentheses", "Min Stack", "Implement Queue using Stacks", "Daily Temperatures", "Sliding Window Maximum"],
  },
];

type Mode = "study" | "placement" | "exam";
type Section = "dsa" | "interview" | "checklist";

const modeConfig = {
  study: { label: "Study Mode", icon: BookOpen, desc: "Learn at your pace", color: "from-emerald-500 to-teal-500" },
  placement: { label: "Placement Mode", icon: Briefcase, desc: "Crack your dream job", color: "from-blue-500 to-indigo-600" },
  exam: { label: "Exam Mode", icon: GraduationCap, desc: "Sprint to exam day", color: "from-amber-500 to-orange-500" },
};

const Placement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("placement");
  const [activeSection, setActiveSection] = useState<Section>("dsa");
  const [interviewTopic, setInterviewTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");
  const [interviewQuestions, setInterviewQuestions] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const { data: dsaProgress } = useQuery({
    queryKey: ["dsaProgress", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("dsa_progress").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const completedTopics = dsaProgress?.filter(d => d.is_completed).length || 0;
  const totalTopics = dsaCategories.reduce((sum, cat) => sum + cat.topics.length, 0);
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const isTopicCompleted = (topicName: string) => dsaProgress?.some(d => d.topic_name === topicName && d.is_completed) || false;

  const toggleTopic = async (topicName: string, category: string) => {
    if (!user) return;
    const existing = dsaProgress?.find(d => d.topic_name === topicName);
    if (existing) {
      await supabase.from("dsa_progress").update({ is_completed: !existing.is_completed }).eq("id", existing.id);
    } else {
      await supabase.from("dsa_progress").insert({ user_id: user.id, topic_name: topicName, category, is_completed: true });
    }
    queryClient.invalidateQueries({ queryKey: ["dsaProgress", user.id] });
  };

  const generateInterviewQuestions = async () => {
    if (!interviewTopic.trim()) {
      toast.error("Enter a topic for interview questions");
      return;
    }
    setGeneratingQuestions(true);
    setInterviewQuestions("");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate 8 ${difficulty === "Mixed" ? "" : difficulty + " difficulty"} technical interview questions for an engineering placement on the topic "${interviewTopic}". For each question:
1. State the question clearly
2. Provide a brief model answer
3. Rate difficulty (Easy/Medium/Hard)

Format in markdown with clear headings. Include a mix of conceptual, coding, and behavioral questions where applicable.`,
          }],
          type: "interview",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to generate questions");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { content += delta; setInterviewQuestions(content); }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const codingChecklist = [
    "Practice 2 DSA problems daily",
    "Complete at least 100 LeetCode problems",
    "Revise OS, DBMS, CN concepts",
    "Build 2-3 projects for resume",
    "Practice system design basics",
    "Mock interviews with peers",
    "Prepare HR questions & STAR method",
    "Keep resume to 1 page, ATS-friendly",
  ];

  const quickTopics = ["Data Structures", "OOP", "DBMS", "Operating Systems", "System Design", "Networking"];
  const ActiveModeIcon = modeConfig[mode].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Briefcase className="w-3.5 h-3.5" /> Placement Mode
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
          Crack Your Dream Placement
        </h1>
        <p className="text-muted-foreground">DSA tracker, AI interview prep, and a focused readiness checklist.</p>
      </motion.div>

      {/* Mode Toggle */}
      <Card className="p-2 bg-muted/40 border-border/60">
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(modeConfig) as Mode[]).map((m) => {
            const Icon = modeConfig[m].icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                <span className="hidden sm:inline">{modeConfig[m].label}</span>
                <span className="sm:hidden">{modeConfig[m].label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Hero Progress Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-border/60">
          <div className={`bg-gradient-to-br ${modeConfig[mode].color} p-6 text-white relative`}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 0%, white 0%, transparent 50%)" }} />
            <div className="relative grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur">
                    <ActiveModeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80">{modeConfig[mode].desc}</p>
                    <p className="font-display font-bold text-xl">DSA Readiness</p>
                  </div>
                </div>
                <div className="flex items-end gap-3 mb-3">
                  <p className="text-5xl font-display font-bold leading-none">{overallProgress}%</p>
                  <p className="text-sm opacity-80 pb-1">{completedTopics} / {totalTopics} topics</p>
                </div>
                <Progress value={overallProgress} className="h-2.5 bg-white/20" />
              </div>
              <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                  <div className="flex items-center gap-2 text-xs opacity-80"><Trophy className="w-3.5 h-3.5" /> Solved</div>
                  <p className="font-display font-bold text-xl mt-1">{completedTopics}</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                  <div className="flex items-center gap-2 text-xs opacity-80"><Target className="w-3.5 h-3.5" /> Remaining</div>
                  <p className="font-display font-bold text-xl mt-1">{totalTopics - completedTopics}</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                  <div className="flex items-center gap-2 text-xs opacity-80"><TrendingUp className="w-3.5 h-3.5" /> Categories</div>
                  <p className="font-display font-bold text-xl mt-1">{dsaCategories.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: "dsa", label: "DSA Tracker", icon: Code },
          { id: "interview", label: "AI Interview Prep", icon: Sparkles },
          { id: "checklist", label: "Readiness Checklist", icon: CheckSquare },
        ] as const).map(t => {
          const Icon = t.icon;
          const active = activeSection === t.id;
          return (
            <Button
              key={t.id}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection(t.id)}
              className={active ? "shadow-sm" : ""}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </Button>
          );
        })}
      </div>

      {/* DSA Tracker */}
      {activeSection === "dsa" && (
        <div className="grid md:grid-cols-2 gap-4">
          {dsaCategories.map((cat, i) => {
            const catCompleted = cat.topics.filter(t => isTopicCompleted(t)).length;
            const catProgress = Math.round((catCompleted / cat.topics.length) * 100);
            const isComplete = catProgress === 100;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-5 h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{cat.icon}</div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground leading-tight">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{catCompleted} of {cat.topics.length} solved</p>
                      </div>
                    </div>
                    {isComplete ? (
                      <Badge className="bg-primary/15 text-primary border-0 hover:bg-primary/15">✓ Done</Badge>
                    ) : (
                      <span className="text-sm font-display font-bold text-foreground">{catProgress}%</span>
                    )}
                  </div>
                  <Progress value={catProgress} className="h-2 mb-4" />
                  <div className="space-y-1">
                    {cat.topics.map(topic => {
                      const done = isTopicCompleted(topic);
                      return (
                        <label
                          key={topic}
                          className="flex items-center gap-3 px-2 py-1.5 -mx-2 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors"
                        >
                          <Checkbox checked={done} onCheckedChange={() => toggleTopic(topic, cat.name)} />
                          <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {topic}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interview Prep */}
      {activeSection === "interview" && (
        <div className="space-y-4">
          <Card className="p-6 border-border/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">AI Interview Question Generator</h3>
                <p className="text-xs text-muted-foreground">Get tailored Q&A for any technical topic, instantly.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                value={interviewTopic}
                onChange={e => setInterviewTopic(e.target.value)}
                placeholder="e.g., Binary Trees, OOP principles, SQL joins, REST APIs..."
                onKeyDown={e => e.key === "Enter" && !generatingQuestions && generateInterviewQuestions()}
                className="h-11"
              />

              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground self-center mr-1">Quick pick:</span>
                {quickTopics.map(t => (
                  <button
                    key={t}
                    onClick={() => setInterviewTopic(t)}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Difficulty:</span>
                  <div className="flex gap-1">
                    {(["Easy", "Medium", "Hard", "Mixed"] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                          difficulty === d
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={generateInterviewQuestions}
                  disabled={generatingQuestions}
                  variant="hero"
                  className="ml-auto"
                >
                  {generatingQuestions ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Questions</>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {!interviewQuestions && !generatingQuestions && (
            <Card className="p-10 border-dashed border-border/60 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <p className="font-display font-medium text-foreground">Ready when you are</p>
              <p className="text-sm text-muted-foreground mt-1">Pick a topic above and we'll craft 8 interview-grade questions with model answers.</p>
            </Card>
          )}

          {interviewQuestions && (
            <Card className="p-6 border-border/60">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Generated for: {interviewTopic}</span>
                <Badge variant="secondary" className="ml-auto">{difficulty}</Badge>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground">
                <ReactMarkdown>{interviewQuestions}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Checklist */}
      {activeSection === "checklist" && (
        <Card className="p-6 border-border/60">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Placement Readiness Checklist</h3>
              <p className="text-xs text-muted-foreground">Tick off the essentials before your placement season.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {codingChecklist.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-transparent hover:border-border cursor-pointer transition-all"
              >
                <Checkbox />
                <span className="text-sm text-foreground">{item}</span>
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Placement;
