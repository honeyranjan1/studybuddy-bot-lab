import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase, Code, CheckSquare, Loader2, Sparkles, Plus, Target, BookOpen, Trophy,
} from "lucide-react";

const dsaCategories = [
  {
    name: "Arrays & Strings",
    topics: ["Two Sum", "Best Time to Buy Sell Stock", "Contains Duplicate", "Product of Array Except Self", "Maximum Subarray", "Longest Substring Without Repeating Characters"],
  },
  {
    name: "Linked Lists",
    topics: ["Reverse Linked List", "Merge Two Sorted Lists", "Detect Cycle", "Remove Nth Node from End", "Reorder List"],
  },
  {
    name: "Trees & Graphs",
    topics: ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Level Order Traversal", "Validate BST", "Number of Islands", "Course Schedule"],
  },
  {
    name: "Dynamic Programming",
    topics: ["Climbing Stairs", "Coin Change", "Longest Increasing Subsequence", "House Robber", "0/1 Knapsack", "Edit Distance"],
  },
  {
    name: "Sorting & Searching",
    topics: ["Binary Search", "Merge Sort", "Quick Sort", "Search in Rotated Array", "Find Minimum in Rotated Array"],
  },
  {
    name: "Stack & Queue",
    topics: ["Valid Parentheses", "Min Stack", "Implement Queue using Stacks", "Daily Temperatures", "Sliding Window Maximum"],
  },
];

const Placement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<"dsa" | "interview" | "checklist">("dsa");
  const [interviewTopic, setInterviewTopic] = useState("");
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
            content: `Generate 8 technical interview questions for an engineering placement on the topic "${interviewTopic}". For each question:
1. State the question clearly
2. Provide a brief model answer
3. Rate difficulty (Easy/Medium/Hard)

Format in markdown. Include a mix of conceptual, coding, and behavioral questions where applicable.`,
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

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4" /> Placement Mode
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">💼 Placement Preparation</h1>
          <p className="text-muted-foreground">DSA tracker, interview prep, and coding checklist</p>
        </motion.div>

        {/* Overall Progress */}
        <Card className="p-6 mb-6 gradient-hero text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <p className="font-display font-bold text-lg">DSA Progress</p>
                <p className="text-sm opacity-80">{completedTopics} / {totalTopics} topics completed</p>
              </div>
            </div>
            <p className="text-3xl font-display font-bold">{overallProgress}%</p>
          </div>
          <Progress value={overallProgress} className="h-3 bg-white/20" />
        </Card>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button variant={activeSection === "dsa" ? "default" : "outline"} onClick={() => setActiveSection("dsa")}>
            <Code className="w-4 h-4 mr-2" /> DSA Tracker
          </Button>
          <Button variant={activeSection === "interview" ? "default" : "outline"} onClick={() => setActiveSection("interview")}>
            <Sparkles className="w-4 h-4 mr-2" /> Interview Questions
          </Button>
          <Button variant={activeSection === "checklist" ? "default" : "outline"} onClick={() => setActiveSection("checklist")}>
            <CheckSquare className="w-4 h-4 mr-2" /> Coding Checklist
          </Button>
        </div>

        {activeSection === "dsa" && (
          <div className="space-y-4">
            {dsaCategories.map(cat => {
              const catCompleted = cat.topics.filter(t => isTopicCompleted(t)).length;
              const catProgress = Math.round((catCompleted / cat.topics.length) * 100);
              return (
                <motion.div key={cat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-semibold text-foreground">{cat.name}</h3>
                      <span className="text-sm text-muted-foreground">{catCompleted}/{cat.topics.length}</span>
                    </div>
                    <Progress value={catProgress} className="h-2 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {cat.topics.map(topic => (
                        <label key={topic} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                          <Checkbox checked={isTopicCompleted(topic)} onCheckedChange={() => toggleTopic(topic, cat.name)} />
                          <span className={`text-sm ${isTopicCompleted(topic) ? "line-through text-muted-foreground" : "text-foreground"}`}>{topic}</span>
                        </label>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeSection === "interview" && (
          <div>
            <Card className="p-6 mb-6">
              <div className="flex gap-3">
                <Input value={interviewTopic} onChange={e => setInterviewTopic(e.target.value)} placeholder="e.g., Data Structures, OOP, DBMS, System Design..." className="flex-1" />
                <Button onClick={generateInterviewQuestions} disabled={generatingQuestions} variant="hero">
                  {generatingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
            {interviewQuestions && (
              <Card className="p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{interviewQuestions}</ReactMarkdown>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeSection === "checklist" && (
          <Card className="p-6">
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">🚀 Placement Preparation Checklist</h3>
            <div className="space-y-3">
              {codingChecklist.map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                  <Checkbox />
                  <span className="text-sm text-foreground">{item}</span>
                </label>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Placement;
