import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill } from "@/components/ui/pill";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Briefcase, Code, CheckSquare, Loader2, Sparkles, Target, BookOpen, Trophy,
  GraduationCap, Brain, TrendingUp, Zap, ArrowRight,
} from "lucide-react";

const dsaCategories = [
  { name: "Arrays & Strings", topics: ["Two Sum", "Best Time to Buy Sell Stock", "Contains Duplicate", "Product of Array Except Self", "Maximum Subarray", "Longest Substring Without Repeating Characters"] },
  { name: "Linked Lists", topics: ["Reverse Linked List", "Merge Two Sorted Lists", "Detect Cycle", "Remove Nth Node from End", "Reorder List"] },
  { name: "Trees & Graphs", topics: ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Level Order Traversal", "Validate BST", "Number of Islands", "Course Schedule"] },
  { name: "Dynamic Programming", topics: ["Climbing Stairs", "Coin Change", "Longest Increasing Subsequence", "House Robber", "0/1 Knapsack", "Edit Distance"] },
  { name: "Sorting & Searching", topics: ["Binary Search", "Merge Sort", "Quick Sort", "Search in Rotated Array", "Find Minimum in Rotated Array"] },
  { name: "Stack & Queue", topics: ["Valid Parentheses", "Min Stack", "Implement Queue using Stacks", "Daily Temperatures", "Sliding Window Maximum"] },
];

type Mode = "study" | "placement" | "exam";
type Section = "dsa" | "interview" | "checklist";

const modeConfig = {
  study: { label: "study", desc: "learn at your pace", icon: BookOpen },
  placement: { label: "placement", desc: "crack your dream job", icon: Briefcase },
  exam: { label: "exam", desc: "sprint to exam day", icon: GraduationCap },
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
  const isTopicCompleted = (t: string) => dsaProgress?.some(d => d.topic_name === t && d.is_completed) || false;

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
    if (!interviewTopic.trim()) { toast.error("enter a topic first"); return; }
    setGeneratingQuestions(true);
    setInterviewQuestions("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate 8 ${difficulty === "Mixed" ? "" : difficulty + " difficulty"} technical interview questions for an engineering placement on the topic "${interviewTopic}". For each: 1) state the question 2) brief model answer 3) rate difficulty. Format in markdown with clear headings.`,
          }],
          type: "interview",
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("failed to generate");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "", buffer = "";
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
      toast.error(e.message || "failed to generate");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const codingChecklist = [
    "practice 2 dsa problems daily",
    "complete at least 100 leetcode problems",
    "revise os, dbms, cn concepts",
    "build 2-3 projects for resume",
    "practice system design basics",
    "mock interviews with peers",
    "prepare hr questions & star method",
    "keep resume to 1 page, ats-friendly",
  ];

  const quickTopics = ["Data Structures", "OOP", "DBMS", "Operating Systems", "System Design", "Networking"];

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  const stats = [
    { label: "solved", value: completedTopics, icon: Trophy },
    { label: "remaining", value: totalTopics - completedTopics, icon: Target },
    { label: "categories", value: dsaCategories.length, icon: TrendingUp },
    { label: "readiness", value: `${overallProgress}%`, icon: Zap },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
      {/* Editorial hero */}
      <motion.div {...fade(0)} className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e]">placement mode</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          <span className="text-xs text-[#8e8e8e] lowercase">{modeConfig[mode].desc}</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-[#1a1a1a]">
          crack your
          <br />
          <span className="text-[#8e8e8e]">dream placement.</span>
        </h1>
        <p className="mt-4 text-[#8e8e8e] text-base md:text-lg max-w-xl">
          dsa tracker, ai interview prep, and a focused readiness checklist — all in one place.
        </p>

        {/* Mode toggle */}
        <div className="mt-6 inline-flex glass rounded-full p-1 gap-1">
          {(Object.keys(modeConfig) as Mode[]).map(m => {
            const Icon = modeConfig[m].icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm lowercase transition-all ${
                  active ? "bg-[#1a1a1a] text-white" : "text-[#6a6a6a] hover:text-[#1a1a1a]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {modeConfig[m].label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fade(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]/10 rounded-3xl overflow-hidden mb-10 border border-[#1a1a1a]/10">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-bg-base p-6 md:p-8 hover:bg-white/60 transition-colors">
              <Icon className="w-4 h-4 text-[#8e8e8e] mb-6" />
              <p className="font-display text-4xl md:text-5xl tracking-tight text-[#1a1a1a] leading-none">{s.value}</p>
              <p className="text-xs text-[#8e8e8e] mt-3 lowercase tracking-wide">{s.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Overall progress */}
      <motion.div {...fade(0.15)} className="glass rounded-3xl p-6 md:p-8 mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e]">dsa readiness</p>
            <p className="font-display text-3xl md:text-4xl text-[#1a1a1a] mt-1">{completedTopics} / {totalTopics} topics</p>
          </div>
          <p className="font-display text-5xl md:text-6xl text-[#1a1a1a] leading-none">{overallProgress}<span className="text-2xl text-[#8e8e8e]">%</span></p>
        </div>
        <Progress value={overallProgress} className="h-2 bg-[#1a1a1a]/10" />
      </motion.div>

      {/* Section tabs */}
      <motion.div {...fade(0.2)} className="flex gap-2 flex-wrap mb-6">
        {([
          { id: "dsa", label: "dsa tracker", icon: Code },
          { id: "interview", label: "ai interview prep", icon: Sparkles },
          { id: "checklist", label: "readiness checklist", icon: CheckSquare },
        ] as const).map(t => {
          const Icon = t.icon;
          const active = activeSection === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm lowercase transition-all ${
                active
                  ? "bg-[#1a1a1a] text-white"
                  : "glass text-[#6a6a6a] hover:text-[#1a1a1a]"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </motion.div>

      {/* DSA */}
      {activeSection === "dsa" && (
        <motion.div {...fade(0.25)} className="space-y-6">
          <Link to="/dsa-practice" className="block">
            <div className="glass rounded-3xl p-6 hover:bg-white/80 hover:-translate-y-0.5 transition-all group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#1a1a1a] text-white"><Code className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-display text-xl text-[#1a1a1a] lowercase">dsa practice — code & run</h3>
                    <p className="text-sm text-[#8e8e8e] mt-0.5">ai-generated problems, online editor, real test execution.</p>
                  </div>
                </div>
                <Pill variant="solid" className="hidden sm:inline-flex">open <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></Pill>
              </div>
            </div>
          </Link>

          <div className="grid md:grid-cols-2 gap-4">
            {dsaCategories.map((cat, i) => {
              const done = cat.topics.filter(t => isTopicCompleted(t)).length;
              const pct = Math.round((done / cat.topics.length) * 100);
              return (
                <motion.div key={cat.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}>
                  <div className="glass rounded-3xl p-6 h-full hover:bg-white/70 transition-colors">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg text-[#1a1a1a] lowercase leading-tight">{cat.name.toLowerCase()}</h3>
                        <p className="text-xs text-[#8e8e8e] mt-0.5">{done} of {cat.topics.length} solved</p>
                      </div>
                      <span className="font-display text-2xl text-[#1a1a1a]">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-[#1a1a1a]/10 mb-4" />
                    <div className="space-y-0.5">
                      {cat.topics.map(topic => {
                        const d = isTopicCompleted(topic);
                        return (
                          <label key={topic} className="flex items-center gap-3 px-2 py-1.5 -mx-2 rounded-xl hover:bg-white/60 cursor-pointer transition-colors">
                            <Checkbox checked={d} onCheckedChange={() => toggleTopic(topic, cat.name)} />
                            <span className={`text-sm flex-1 lowercase ${d ? "line-through text-[#8e8e8e]" : "text-[#1a1a1a]"}`}>{topic.toLowerCase()}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Interview */}
      {activeSection === "interview" && (
        <motion.div {...fade(0.25)} className="space-y-6">
          <Link to="/mock-interview" className="block">
            <div className="glass rounded-3xl p-6 hover:bg-white/80 hover:-translate-y-0.5 transition-all group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#1a1a1a] text-white"><Brain className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-display text-xl text-[#1a1a1a] lowercase">ai mock interview — live scoring</h3>
                    <p className="text-sm text-[#8e8e8e] mt-0.5">full mock rounds with real-time feedback and a scoring rubric.</p>
                  </div>
                </div>
                <Pill variant="solid" className="hidden sm:inline-flex">start <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></Pill>
              </div>
            </div>
          </Link>
          <div className="glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-[#1a1a1a] text-white"><Brain className="w-5 h-5" /></div>
              <div>
                <h3 className="font-display text-xl text-[#1a1a1a] lowercase">ai interview question generator</h3>
                <p className="text-xs text-[#8e8e8e] mt-0.5">get tailored q&a for any technical topic, instantly.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                value={interviewTopic}
                onChange={e => setInterviewTopic(e.target.value)}
                placeholder="e.g. binary trees, oop principles, sql joins, rest apis…"
                onKeyDown={e => e.key === "Enter" && !generatingQuestions && generateInterviewQuestions()}
                className="h-12 rounded-full bg-white/70 border-black/5 px-5 lowercase focus-visible:bg-white focus-visible:border-black/20"
              />

              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-[#8e8e8e] self-center mr-1 lowercase">quick pick:</span>
                {quickTopics.map(t => (
                  <button
                    key={t}
                    onClick={() => setInterviewTopic(t)}
                    className="text-xs px-3 py-1.5 rounded-full glass text-[#6a6a6a] hover:text-[#1a1a1a] lowercase transition-colors"
                  >
                    {t.toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-xs text-[#8e8e8e] lowercase">difficulty:</span>
                <div className="inline-flex glass rounded-full p-1 gap-1">
                  {(["Easy", "Medium", "Hard", "Mixed"] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`text-xs px-3 py-1.5 rounded-full lowercase transition-all ${
                        difficulty === d ? "bg-[#1a1a1a] text-white" : "text-[#6a6a6a] hover:text-[#1a1a1a]"
                      }`}
                    >
                      {d.toLowerCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={generateInterviewQuestions}
                  disabled={generatingQuestions}
                  className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm lowercase hover:bg-[#333] disabled:opacity-60 transition-colors"
                >
                  {generatingQuestions ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> generating…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> generate questions</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {!interviewQuestions && !generatingQuestions && (
            <div className="rounded-3xl border border-dashed border-[#1a1a1a]/15 p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#1a1a1a]" />
              </div>
              <p className="font-display text-lg text-[#1a1a1a] lowercase">ready when you are</p>
              <p className="text-sm text-[#8e8e8e] mt-1">pick a topic above and we'll craft 8 interview-grade questions with model answers.</p>
            </div>
          )}

          {interviewQuestions && (
            <div className="glass rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1a1a1a]/10">
                <Sparkles className="w-4 h-4 text-[#1a1a1a]" />
                <span className="text-sm text-[#1a1a1a] lowercase">generated for: {interviewTopic.toLowerCase()}</span>
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a]/5 text-[#6a6a6a] lowercase">{difficulty.toLowerCase()}</span>
              </div>
              <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-[#1a1a1a] prose-p:text-[#4a4a4a] prose-strong:text-[#1a1a1a]">
                <ReactMarkdown>{interviewQuestions}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Checklist */}
      {activeSection === "checklist" && (
        <motion.div {...fade(0.25)} className="glass rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-[#1a1a1a] text-white"><CheckSquare className="w-5 h-5" /></div>
            <div>
              <h3 className="font-display text-xl text-[#1a1a1a] lowercase">placement readiness checklist</h3>
              <p className="text-xs text-[#8e8e8e] mt-0.5">tick off the essentials before your placement season.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {codingChecklist.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 hover:bg-white/80 border border-transparent hover:border-[#1a1a1a]/10 cursor-pointer transition-all"
              >
                <Checkbox />
                <span className="text-sm text-[#1a1a1a] lowercase">{item}</span>
              </label>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Placement;
