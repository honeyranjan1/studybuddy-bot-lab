import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useTheme } from "@/hooks/useTheme";
import {
  Loader2, Play, Send, Sparkles, Code2, CheckCircle2, XCircle,
  Cpu, Timer, Target, TrendingUp, AlertTriangle, BookOpen, Trophy,
} from "lucide-react";

const TOPICS = [
  "Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees",
  "Graphs", "Dynamic Programming", "Recursion", "Searching", "Sorting",
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const LANGUAGES: { id: "cpp" | "java" | "python" | "javascript"; label: string; monaco: string }[] = [
  { id: "cpp", label: "C++", monaco: "cpp" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
];

type TestCase = { input: string; output: string; hidden: boolean };
type Problem = {
  id?: string;
  title: string; statement: string;
  input_format: string; output_format: string; constraints: string;
  sample_input: string; sample_output: string; explanation: string;
  test_cases: TestCase[];
  starter_code: Record<string, string>;
  optimal_solution: string;
};
type RunResult = {
  status: string;
  passed_count: number; total_count: number;
  runtime_ms: number; memory_kb: number;
  results: any[]; compile_error: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  wrong_answer: "bg-red-500/15 text-red-600 border-red-500/30",
  runtime_error: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  compile_error: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  passed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

export default function DsaPractice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState("Easy");
  const [language, setLanguage] = useState<typeof LANGUAGES[number]["id"]>("python");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [run, setRun] = useState<RunResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [showOptimal, setShowOptimal] = useState(false);
  const [activeTab, setActiveTab] = useState("problem");

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["dsa-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("dsa_submissions")
        .select("topic,status,created_at,problem_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      const subs = data || [];
      const accepted = subs.filter((s) => s.status === "accepted");
      const solvedIds = new Set(accepted.map((s) => s.problem_id));
      const total = subs.length;
      const acc = total ? Math.round((accepted.length / total) * 100) : 0;
      const byTopic: Record<string, { ok: number; total: number }> = {};
      subs.forEach((s) => {
        if (!byTopic[s.topic]) byTopic[s.topic] = { ok: 0, total: 0 };
        byTopic[s.topic].total++;
        if (s.status === "accepted") byTopic[s.topic].ok++;
      });
      const topicEntries = Object.entries(byTopic);
      const best = topicEntries.sort((a, b) => b[1].ok / b[1].total - a[1].ok / a[1].total)[0];
      const weak = topicEntries.sort((a, b) => a[1].ok / a[1].total - b[1].ok / b[1].total)[0];
      return {
        solved: solvedIds.size,
        accuracy: acc,
        bestTopic: best?.[0] || "—",
        weakTopic: weak?.[0] || "—",
        recent: subs.slice(0, 5),
      };
    },
  });

  useEffect(() => {
    if (problem?.starter_code?.[language]) setCode(problem.starter_code[language]);
  }, [language, problem]);

  const generate = async () => {
    if (!user) return;
    setGenerating(true); setProblem(null); setRun(null); setAiFeedback(""); setShowOptimal(false);
    const { data, error } = await supabase.functions.invoke("generate-dsa-problem", {
      body: { topic, difficulty },
    });
    if (error || data?.error) { toast.error("Failed to generate problem"); setGenerating(false); return; }
    const { data: saved, error: insErr } = await supabase
      .from("dsa_problems")
      .insert({
        user_id: user.id, topic, difficulty,
        title: data.title, statement: data.statement,
        input_format: data.input_format, output_format: data.output_format,
        constraints: data.constraints, sample_input: data.sample_input,
        sample_output: data.sample_output, explanation: data.explanation,
        test_cases: data.test_cases, starter_code: data.starter_code,
        optimal_solution: data.optimal_solution,
      })
      .select().single();
    if (insErr) { toast.error("Couldn't save problem"); setGenerating(false); return; }
    setProblem(saved as any);
    setCode(((saved as any).starter_code?.[language]) || "");
    setActiveTab("problem");
    setGenerating(false);
  };

  const runCode = async (submit: boolean) => {
    if (!problem) return;
    submit ? setSubmitting(true) : setRunning(true);
    setActiveTab("results");
    const tcs = submit ? problem.test_cases : problem.test_cases.filter((t) => !t.hidden).slice(0, 2);
    const { data, error } = await supabase.functions.invoke("run-dsa-code", {
      body: { language, code, test_cases: tcs },
    });
    if (error || data?.error) {
      toast.error("Execution failed");
      submit ? setSubmitting(false) : setRunning(false); return;
    }
    setRun(data);
    if (submit && user && problem.id) {
      await supabase.from("dsa_submissions").insert({
        user_id: user.id, problem_id: problem.id, topic, difficulty,
        language, code, status: data.status,
        passed_count: data.passed_count, total_count: data.total_count,
        runtime_ms: data.runtime_ms, memory_kb: data.memory_kb,
        results: data.results,
      });
      qc.invalidateQueries({ queryKey: ["dsa-stats"] });
      if (data.status !== "accepted") {
        const { data: fb } = await supabase.functions.invoke("explain-dsa-error", {
          body: { problem, language, code, results: data.results, status: data.status },
        });
        if (fb?.feedback) setAiFeedback(fb.feedback);
      } else {
        toast.success("🎉 All test cases passed!");
      }
    }
    submit ? setSubmitting(false) : setRunning(false);
  };

  const visibleResults = run?.results.filter((r) => !r.hidden) || [];
  const hiddenSummary = run?.results.filter((r) => r.hidden) || [];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Code2 className="text-primary" /> DSA Practice
          </h1>
          <p className="text-sm text-muted-foreground">AI-generated coding problems with real execution.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Trophy className="text-primary" size={18} />} label="Solved" value={stats?.solved ?? 0} />
        <StatCard icon={<Target className="text-emerald-500" size={18} />} label="Accuracy" value={`${stats?.accuracy ?? 0}%`} />
        <StatCard icon={<TrendingUp className="text-blue-500" size={18} />} label="Best Topic" value={stats?.bestTopic ?? "—"} />
        <StatCard icon={<AlertTriangle className="text-orange-500" size={18} />} label="Weak Topic" value={stats?.weakTopic ?? "—"} />
      </div>

      {/* Selectors */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Topic</label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
            Generate Problem
          </Button>
        </div>
      </Card>

      {!problem && !generating && (
        <Card className="p-10 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 text-primary/60" size={40} />
          Pick a topic and difficulty, then click <b>Generate Problem</b> to start coding.
        </Card>
      )}

      {problem && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* LEFT: problem + tabs */}
          <Card className="p-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2">
                <TabsTrigger value="problem">Problem</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="solution" disabled={!showOptimal}>Optimal</TabsTrigger>
              </TabsList>

              <TabsContent value="problem" className="m-0">
                <ScrollArea className="h-[60vh] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{problem.title}</h2>
                    <Badge variant="secondary">{difficulty}</Badge>
                    <Badge variant="outline">{topic}</Badge>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{problem.statement}</ReactMarkdown>
                    <h4>Input Format</h4><p>{problem.input_format}</p>
                    <h4>Output Format</h4><p>{problem.output_format}</p>
                    <h4>Constraints</h4><pre className="text-xs">{problem.constraints}</pre>
                    <h4>Sample Input</h4><pre className="text-xs">{problem.sample_input}</pre>
                    <h4>Sample Output</h4><pre className="text-xs">{problem.sample_output}</pre>
                    <h4>Explanation</h4><p>{problem.explanation}</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="results" className="m-0">
                <ScrollArea className="h-[60vh] p-4 space-y-3">
                  {!run && <p className="text-sm text-muted-foreground">Run or submit your code to see results.</p>}
                  {run && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge className={STATUS_COLORS[run.status] || ""}>{run.status.replace("_", " ").toUpperCase()}</Badge>
                        <div className="text-sm text-muted-foreground flex gap-3">
                          <span className="flex items-center gap-1"><Timer size={14} />{run.runtime_ms}ms</span>
                          <span className="flex items-center gap-1"><Cpu size={14} />{run.memory_kb}KB</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Test cases</span>
                          <span>{run.passed_count}/{run.total_count} passed</span>
                        </div>
                        <Progress value={(run.passed_count / Math.max(1, run.total_count)) * 100} />
                      </div>
                      {run.compile_error && (
                        <Card className="p-3 bg-yellow-500/10 border-yellow-500/30">
                          <div className="text-xs font-semibold mb-1">Compilation Error</div>
                          <pre className="text-xs whitespace-pre-wrap">{run.compile_error}</pre>
                        </Card>
                      )}
                      {visibleResults.map((r, i) => (
                        <Card key={i} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Test #{r.index + 1}</span>
                            {r.status === "passed"
                              ? <CheckCircle2 className="text-emerald-500" size={18} />
                              : <XCircle className="text-red-500" size={18} />}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><div className="text-muted-foreground mb-1">Input</div><pre className="bg-muted p-2 rounded">{r.input}</pre></div>
                            <div><div className="text-muted-foreground mb-1">Expected</div><pre className="bg-muted p-2 rounded">{r.expected}</pre></div>
                            <div className="col-span-2"><div className="text-muted-foreground mb-1">Your Output</div><pre className="bg-muted p-2 rounded">{r.actual || "(empty)"}</pre></div>
                            {r.stderr && <div className="col-span-2"><div className="text-red-500 mb-1">stderr</div><pre className="bg-red-500/10 p-2 rounded">{r.stderr}</pre></div>}
                          </div>
                        </Card>
                      ))}
                      {hiddenSummary.length > 0 && (
                        <Card className="p-3 bg-muted/50">
                          <div className="text-xs font-semibold mb-1">Hidden Test Cases</div>
                          <div className="text-xs">
                            {hiddenSummary.filter((r) => r.status === "passed").length}/{hiddenSummary.length} passed
                          </div>
                        </Card>
                      )}
                      {aiFeedback && (
                        <Card className="p-3 border-primary/30 bg-primary/5">
                          <div className="text-xs font-semibold mb-2 flex items-center gap-1"><Sparkles size={14} /> AI Coach</div>
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>{aiFeedback}</ReactMarkdown>
                          </div>
                          {!showOptimal && (
                            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setShowOptimal(true); setActiveTab("solution"); }}>
                              View Optimal Solution
                            </Button>
                          )}
                        </Card>
                      )}
                      {run.status === "accepted" && !showOptimal && (
                        <Button variant="outline" onClick={() => { setShowOptimal(true); setActiveTab("solution"); }}>
                          View Optimal Solution
                        </Button>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="solution" className="m-0">
                <ScrollArea className="h-[60vh] p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{`\`\`\`python\n${problem.optimal_solution}\n\`\`\``}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>

          {/* RIGHT: editor */}
          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/30">
              <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => runCode(false)} disabled={running || submitting} className="gap-1">
                  {running ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />} Run
                </Button>
                <Button size="sm" onClick={() => runCode(true)} disabled={running || submitting} className="gap-1">
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Submit
                </Button>
              </div>
            </div>
            <Editor
              height="60vh"
              language={LANGUAGES.find((l) => l.id === language)?.monaco}
              theme={theme === "dark" ? "vs-dark" : "light"}
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false,
                tabSize: 2, automaticLayout: true,
              }}
            />
          </Card>
        </div>
      )}

      {stats?.recent && stats.recent.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen size={16} /> Recent Submissions</h3>
          <div className="space-y-1">
            {stats.recent.map((s: any) => (
              <div key={s.created_at} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span>{s.topic}</span>
                <Badge variant="outline" className={STATUS_COLORS[s.status] || ""}>{s.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="text-lg font-semibold truncate">{value}</div>
    </Card>
  );
}
