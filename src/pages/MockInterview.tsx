import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Pill } from "@/components/ui/pill";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Mic, MicOff, Send, Loader2, Sparkles, ArrowLeft, ArrowRight, Trophy,
  Target, MessageSquare, RefreshCw, CheckCircle2, Brain,
} from "lucide-react";

type Question = { id: number; question: string; type: string; expected_points: string[] };
type Scores = { clarity: number; correctness: number; depth: number; communication: number };
type Feedback = {
  scores: Scores;
  overall: number;
  strengths: string[];
  improvements: string[];
  model_answer: string;
};
type Result = { question: Question; answer: string; feedback: Feedback };
type Summary = {
  overall_score: number;
  verdict: string;
  top_strengths: string[];
  top_improvements: string[];
  study_plan: string[];
  summary: string;
};

type Stage = "setup" | "interview" | "summary";

const roles = ["Software Engineer", "Frontend Developer", "Backend Developer", "Data Analyst", "Product Manager", "ML Engineer"];
const quickTopics = ["Data Structures", "System Design", "REST APIs", "SQL & Databases", "OOP", "React & Frontend"];

const API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`;
const AUTH = { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` };

async function apiCall(body: any) {
  const r = await fetch(API, { method: "POST", headers: AUTH, body: JSON.stringify(body) });
  if (!r.ok) throw new Error((await r.json()).error || "request failed");
  return r.json();
}

const RubricBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-[#6a6a6a] lowercase">{label}</span>
      <span className="text-[#1a1a1a] font-medium">{value}/10</span>
    </div>
    <Progress value={value * 10} className="h-1.5 bg-[#1a1a1a]/10" />
  </div>
);

const MockInterview = () => {
  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState("Software Engineer");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scoring, setScoring] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const startInterview = async () => {
    if (!topic.trim()) return toast.error("enter a topic");
    setLoading(true);
    try {
      const { questions: qs } = await apiCall({ action: "start", role, topic, difficulty, numQuestions });
      setQuestions(qs);
      setCurrentIdx(0);
      setResults([]);
      setFeedback(null);
      setAnswer("");
      setStage("interview");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error("write your answer first");
    setScoring(true);
    try {
      const q = questions[currentIdx];
      const fb: Feedback = await apiCall({
        action: "feedback",
        question: q.question,
        expected_points: q.expected_points,
        answer,
        role,
      });
      setFeedback(fb);
      setResults(r => [...r, { question: q, answer, feedback: fb }]);
    } catch (e: any) { toast.error(e.message); }
    finally { setScoring(false); }
  };

  const nextQuestion = async () => {
    setFeedback(null);
    setAnswer("");
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
    } else {
      setLoading(true);
      try {
        const s: Summary = await apiCall({
          action: "summary", role, topic,
          results: results.map(r => ({ question: r.question.question, overall: r.feedback.overall, scores: r.feedback.scores })),
        });
        setSummary(s);
        setStage("summary");
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    }
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("speech recognition not supported in this browser");
    if (listening && recognition) { recognition.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setAnswer(prev => prev + " " + txt);
    };
    rec.onend = () => setListening(false);
    rec.start();
    setRecognition(rec);
    setListening(true);
  };

  const reset = () => {
    setStage("setup"); setQuestions([]); setResults([]); setSummary(null);
    setFeedback(null); setAnswer(""); setCurrentIdx(0);
  };

  const fade = (d = 0) => ({
    initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 md:px-8 py-8 md:py-12">
      <motion.div {...fade(0)} className="mb-8">
        <Link to="/placement" className="inline-flex items-center gap-2 text-sm text-[#6a6a6a] hover:text-[#1a1a1a] mb-4 lowercase">
          <ArrowLeft className="w-4 h-4" /> back to placement
        </Link>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e]">ai mock interview</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          <span className="text-xs text-[#8e8e8e] lowercase">real-time feedback</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight text-[#1a1a1a]">
          practice like it's
          <br /><span className="text-[#8e8e8e]">the real thing.</span>
        </h1>
      </motion.div>

      <AnimatePresence mode="wait">
        {stage === "setup" && (
          <motion.div key="setup" {...fade(0.1)} className="glass rounded-3xl p-6 md:p-10 space-y-6">
            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-3 block">target role</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`text-sm px-4 py-2 rounded-full lowercase transition-all ${role === r ? "bg-[#1a1a1a] text-white" : "glass text-[#6a6a6a] hover:text-[#1a1a1a]"}`}>
                    {r.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-3 block">topic focus</label>
              <Input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. react hooks, sql joins, system design basics…"
                className="h-12 rounded-full bg-white/70 border-black/5 px-5 lowercase" />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {quickTopics.map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="text-xs px-3 py-1.5 rounded-full glass text-[#6a6a6a] hover:text-[#1a1a1a] lowercase">
                    {t.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-3 block">difficulty</label>
                <div className="inline-flex glass rounded-full p-1 gap-1">
                  {(["Easy", "Medium", "Hard"] as const).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`text-sm px-4 py-2 rounded-full lowercase transition-all ${difficulty === d ? "bg-[#1a1a1a] text-white" : "text-[#6a6a6a] hover:text-[#1a1a1a]"}`}>
                      {d.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-3 block">questions ({numQuestions})</label>
                <input type="range" min={3} max={10} value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-[#1a1a1a]" />
              </div>
            </div>

            <button onClick={startInterview} disabled={loading}
              className="w-full h-14 rounded-full bg-[#1a1a1a] text-white font-medium lowercase hover:bg-[#333] disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> preparing your interview…</> : <><Sparkles className="w-4 h-4" /> start mock interview</>}
            </button>
          </motion.div>
        )}

        {stage === "interview" && questions.length > 0 && (
          <motion.div key="interview" {...fade(0.1)} className="space-y-6">
            <div className="glass rounded-3xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">question {currentIdx + 1} of {questions.length}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-[#1a1a1a]/5 text-[#6a6a6a] lowercase">{questions[currentIdx].type}</span>
              </div>
              <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1 bg-[#1a1a1a]/10 mb-6" />
              <h2 className="font-display text-2xl md:text-3xl text-[#1a1a1a] leading-tight">
                {questions[currentIdx].question}
              </h2>
            </div>

            {!feedback && (
              <div className="glass rounded-3xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">your answer</label>
                  <button onClick={toggleMic}
                    className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full lowercase transition-all ${listening ? "bg-red-500 text-white" : "glass text-[#6a6a6a] hover:text-[#1a1a1a]"}`}>
                    {listening ? <><MicOff className="w-3.5 h-3.5" /> stop</> : <><Mic className="w-3.5 h-3.5" /> voice</>}
                  </button>
                </div>
                <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder="type or dictate your answer… speak like you would in a real interview."
                  rows={6}
                  className="w-full bg-white/70 border border-black/5 rounded-2xl px-5 py-4 text-[#1a1a1a] placeholder:text-[#8e8e8e] focus:outline-none focus:border-black/20 resize-none" />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-[#8e8e8e]">{answer.split(/\s+/).filter(Boolean).length} words</span>
                  <button onClick={submitAnswer} disabled={scoring || !answer.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm lowercase hover:bg-[#333] disabled:opacity-60">
                    {scoring ? <><Loader2 className="w-4 h-4 animate-spin" /> scoring…</> : <><Send className="w-4 h-4" /> submit answer</>}
                  </button>
                </div>
              </div>
            )}

            {feedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="glass rounded-3xl p-6 md:p-8">
                  <div className="flex items-baseline justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">overall score</p>
                      <p className="font-display text-5xl md:text-6xl text-[#1a1a1a] mt-1">
                        {feedback.overall}<span className="text-2xl text-[#8e8e8e]">/10</span>
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-[#1a1a1a]/30" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <RubricBar label="clarity" value={feedback.scores.clarity} />
                    <RubricBar label="correctness" value={feedback.scores.correctness} />
                    <RubricBar label="depth" value={feedback.scores.depth} />
                    <RubricBar label="communication" value={feedback.scores.communication} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm text-[#1a1a1a] lowercase">strengths</h4>
                    </div>
                    <ul className="space-y-2">
                      {feedback.strengths.map((s, i) => <li key={i} className="text-sm text-[#4a4a4a] flex gap-2"><span className="text-emerald-600">·</span>{s}</li>)}
                    </ul>
                  </div>
                  <div className="glass rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm text-[#1a1a1a] lowercase">improvements</h4>
                    </div>
                    <ul className="space-y-2">
                      {feedback.improvements.map((s, i) => <li key={i} className="text-sm text-[#4a4a4a] flex gap-2"><span className="text-amber-600">·</span>{s}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="glass rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-[#1a1a1a]" />
                    <h4 className="text-sm text-[#1a1a1a] lowercase">model answer</h4>
                  </div>
                  <div className="prose prose-sm max-w-none text-[#4a4a4a]"><ReactMarkdown>{feedback.model_answer}</ReactMarkdown></div>
                </div>

                <button onClick={nextQuestion} disabled={loading}
                  className="w-full h-14 rounded-full bg-[#1a1a1a] text-white font-medium lowercase hover:bg-[#333] disabled:opacity-60 inline-flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> generating summary…</>
                    : currentIdx + 1 < questions.length ? <>next question <ArrowRight className="w-4 h-4" /></>
                    : <>see final report <Trophy className="w-4 h-4" /></>}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {stage === "summary" && summary && (
          <motion.div key="summary" {...fade(0.1)} className="space-y-6">
            <div className="glass rounded-3xl p-8 md:p-12 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e] mb-4">interview complete</p>
              <p className="font-display text-7xl md:text-8xl text-[#1a1a1a] leading-none">
                {summary.overall_score}<span className="text-3xl text-[#8e8e8e]">/10</span>
              </p>
              <p className="mt-4 inline-flex px-4 py-1.5 rounded-full bg-[#1a1a1a] text-white text-sm lowercase">{summary.verdict.toLowerCase()}</p>
              <p className="mt-6 text-[#4a4a4a] max-w-2xl mx-auto">{summary.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><h4 className="text-sm text-[#1a1a1a] lowercase">top strengths</h4></div>
                <ul className="space-y-2">{summary.top_strengths.map((s, i) => <li key={i} className="text-sm text-[#4a4a4a] flex gap-2"><span className="text-emerald-600">·</span>{s}</li>)}</ul>
              </div>
              <div className="glass rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-amber-600" /><h4 className="text-sm text-[#1a1a1a] lowercase">top improvements</h4></div>
                <ul className="space-y-2">{summary.top_improvements.map((s, i) => <li key={i} className="text-sm text-[#4a4a4a] flex gap-2"><span className="text-amber-600">·</span>{s}</li>)}</ul>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-[#1a1a1a]" /><h4 className="text-sm text-[#1a1a1a] lowercase">your study plan</h4></div>
              <ul className="space-y-2">{summary.study_plan.map((s, i) => <li key={i} className="text-sm text-[#4a4a4a] flex gap-2"><span className="text-[#1a1a1a]">{i + 1}.</span>{s}</li>)}</ul>
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-[#1a1a1a]" /><h4 className="text-sm text-[#1a1a1a] lowercase">question-by-question breakdown</h4></div>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/50 border border-black/5">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <p className="text-sm text-[#1a1a1a] flex-1">{i + 1}. {r.question.question}</p>
                      <span className="font-display text-xl text-[#1a1a1a]">{r.feedback.overall}<span className="text-xs text-[#8e8e8e]">/10</span></span>
                    </div>
                    <div className="flex gap-3 text-xs text-[#8e8e8e]">
                      <span>clarity {r.feedback.scores.clarity}</span>
                      <span>correctness {r.feedback.scores.correctness}</span>
                      <span>depth {r.feedback.scores.depth}</span>
                      <span>communication {r.feedback.scores.communication}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 h-14 rounded-full bg-[#1a1a1a] text-white lowercase inline-flex items-center justify-center gap-2 hover:bg-[#333]">
                <RefreshCw className="w-4 h-4" /> new interview
              </button>
              <Link to="/placement" className="flex-1">
                <Pill variant="glass" className="w-full h-14 justify-center">back to placement</Pill>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockInterview;
