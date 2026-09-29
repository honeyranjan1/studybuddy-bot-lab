import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity, ArrowRight, Calendar, CheckCircle2, ClipboardList, FileSearch,
  FileText, Flame, Layers, Lightbulb, MessageSquare, Sparkles, Trophy, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MiniScene3D } from "@/components/desk/PageScene3D";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "student";

  const { data: streak } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("learning_streaks").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: Boolean(user),
  });
  const { data: quizResults = [] } = useQuery({
    queryKey: ["quizResults", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("quiz_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: Boolean(user),
  });
  const { data: examCountdowns = [] } = useQuery({
    queryKey: ["examCountdowns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("exam_countdowns").select("*").eq("user_id", user.id).eq("is_active", true).order("exam_date", { ascending: true }).limit(3);
      return data || [];
    },
    enabled: Boolean(user),
  });
  const { data: recentNotes = [] } = useQuery({
    queryKey: ["recentNotes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("generated_notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: Boolean(user),
  });
  const { data: notesCount = 0 } = useQuery({
    queryKey: ["notesCount", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from("generated_notes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return count || 0;
    },
    enabled: Boolean(user),
  });
  const { data: flashcardsCount = 0 } = useQuery({
    queryKey: ["flashcardsCount", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      return count || 0;
    },
    enabled: Boolean(user),
  });

  const totalQuizzes = quizResults.length;
  const avgScore = totalQuizzes ? Math.round(quizResults.reduce((sum, q) => sum + q.score, 0) / totalQuizzes) : 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayQuizzes = quizResults.filter((q) => new Date(q.created_at) >= todayStart).length;
  const weakTopics = quizResults.filter((q) => q.score < 60).slice(0, 3).map((q) => ({ topic: q.topic, subject: q.subject, score: q.score }));

  const subjectMap: Record<string, { total: number; correct: number; count: number }> = {};
  quizResults.forEach((q) => {
    subjectMap[q.subject] ||= { total: 0, correct: 0, count: 0 };
    subjectMap[q.subject].total += q.total_questions;
    subjectMap[q.subject].correct += q.correct_answers;
    subjectMap[q.subject].count += 1;
  });
  const subjectList = Object.entries(subjectMap).map(([name, data]) => ({
    name,
    progress: data.total ? Math.round((data.correct / data.total) * 100) : 0,
    quizzes: data.count,
  })).slice(0, 4);

  const weeklyData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => {
    const results = quizResults.filter((q) => new Date(q.created_at).getDay() === index);
    return { day, score: results.length ? Math.round(results.reduce((sum, q) => sum + q.score, 0) / results.length) : 0 };
  });

  type DashboardActivity = { title: string; subject: string; meta: string; date: Date; icon: typeof ClipboardList };
  const activities: DashboardActivity[] = [
    ...quizResults.slice(0, 4).map((q): DashboardActivity => ({ title: `Completed ${q.topic}`, subject: q.subject, meta: `${q.score}%`, date: new Date(q.created_at), icon: ClipboardList })),
    ...recentNotes.slice(0, 4).map((n): DashboardActivity => ({ title: `Notes on ${n.topic}`, subject: n.subject, meta: "Notes", date: new Date(n.created_at), icon: FileText })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const stats = [
    { label: "day streak", value: streak?.current_streak ?? 0, detail: "momentum", icon: Flame },
    { label: "total xp", value: (streak?.total_xp ?? 0).toLocaleString(), detail: "earned", icon: Zap },
    { label: "today", value: todayQuizzes, detail: "sessions", icon: Activity },
    { label: "average", value: `${avgScore}%`, detail: "quiz score", icon: Trophy },
  ];
  const quickActions = [
    { to: "/notes", label: "Generate notes", icon: FileText },
    { to: "/quiz", label: "Practice quiz", icon: ClipboardList },
    { to: "/flashcards", label: "Flashcards", icon: Layers },
    { to: "/pdf-summary", label: "PDF summary", icon: FileSearch },
  ];
  const fade = (delay = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const } });
  const daysRemaining = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  return (
    <div className="lux-root lux-grid relative min-h-full overflow-hidden px-4 py-6 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.section {...fade()} className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="lux-panel flex min-h-[340px] flex-col justify-between p-7 md:p-10">
            <div className="flex items-center justify-between gap-4">
              <span className="lux-kicker"><span className="size-1.5 rounded-full bg-destructive" /> Learning intelligence</span>
              <span className="lux-eyebrow hidden sm:block">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</span>
            </div>
            <div className="mt-14">
              <p className="lux-gold mb-4 text-sm">Welcome back, {displayName}</p>
              <h1 className="lux-text max-w-4xl font-display text-5xl font-medium leading-[0.92] md:text-7xl lg:text-[5.5rem]">
                Your learning,
                <br />in <span className="lux-serif lux-gold">motion.</span>
              </h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-destructive px-6 text-destructive-foreground hover:bg-destructive/90"><Link to="/quiz">Start a session <ArrowRight /></Link></Button>
                <Button asChild variant="outline" className="rounded-full border-border/60 bg-background/5 text-current hover:bg-background/10"><Link to="/chat"><MessageSquare /> Ask AI tutor</Link></Button>
              </div>
            </div>
          </div>
          <div className="lux-panel min-h-[340px] p-2">
            <div className="absolute left-6 top-6 z-10">
              <p className="lux-eyebrow">Performance object</p>
              <p className="lux-text mt-2 text-sm">Live learning pulse</p>
            </div>
            <MiniScene3D kind="dashboard" />
            <div className="absolute inset-x-6 bottom-5 flex justify-between text-[10px] uppercase tracking-[.16em] lux-dim"><span>{totalQuizzes} sessions indexed</span><span>{avgScore}% signal</span></div>
          </div>
        </motion.section>

        <motion.section {...fade(0.08)} className="lux-panel mt-5 grid grid-cols-2 overflow-hidden lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return <div className="lux-stat" key={stat.label}>
              <div className="flex items-start justify-between"><p className="lux-eyebrow">{stat.label}</p><Icon className="size-4 lux-gold" /></div>
              <p className="lux-text mt-8 font-display text-4xl leading-none md:text-5xl">{stat.value}</p>
              <p className="lux-dim mt-2 text-xs">{stat.detail}</p>
            </div>;
          })}
        </motion.section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_.8fr]">
          <motion.section {...fade(0.14)} className="lux-panel p-6 md:p-8">
            <div className="mb-7 flex items-end justify-between">
              <div><p className="lux-eyebrow">Seven-day signal</p><h2 className="lux-text mt-2 text-2xl">Weekly performance</h2></div>
              <span className="lux-gold text-3xl">{avgScore}%</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}>
                <defs><linearGradient id="luxScore" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--lux-gold))" stopOpacity={0.42} /><stop offset="100%" stopColor="hsl(var(--lux-gold))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="hsl(var(--lux-line))" vertical={false} />
                <XAxis dataKey="day" fontSize={10} stroke="hsl(var(--lux-dim))" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} stroke="hsl(var(--lux-dim))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--lux-line))", background: "hsl(var(--lux-panel))", color: "hsl(var(--lux-text))", fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--lux-gold))" fill="url(#luxScore)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.section>

          <motion.section {...fade(0.18)} className="lux-panel p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between"><div><p className="lux-eyebrow">Next milestones</p><h2 className="lux-text mt-2 text-2xl">Exams</h2></div><Calendar className="size-5 lux-gold" /></div>
            <div className="space-y-3">
              {examCountdowns.length ? examCountdowns.map((exam) => {
                const days = daysRemaining(exam.exam_date);
                return <div key={exam.id} className="lux-row flex items-center gap-4 p-4">
                  <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border/20 bg-background/10"><strong className="lux-text text-xl">{days < 0 ? "✓" : days}</strong><span className="lux-eyebrow !text-[8px]">{days < 0 ? "done" : "days"}</span></div>
                  <div className="min-w-0"><p className="lux-text truncate text-sm">{exam.exam_name}</p><p className="lux-dim mt-1 text-xs">{exam.subject || "Exam"}</p></div>
                </div>;
              }) : <div className="py-12 text-center"><Calendar className="lux-dim mx-auto mb-3 size-8" /><p className="lux-dim text-sm">No exams scheduled</p><Button asChild variant="link" className="lux-gold mt-2"><Link to="/exam-countdown">Add an exam</Link></Button></div>}
            </div>
          </motion.section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <motion.section {...fade(0.22)} className="lux-panel p-6 md:p-8 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between"><div><p className="lux-eyebrow">Subject matrix</p><h2 className="lux-text mt-2 text-2xl">Mastery map</h2></div><Button asChild variant="ghost" className="lux-dim"><Link to="/quiz">Take quiz <ArrowRight /></Link></Button></div>
            {subjectList.length ? <div className="grid gap-5 sm:grid-cols-2">{subjectList.map((subject) => <div key={subject.name} className="lux-row p-5"><div className="mb-4 flex justify-between gap-2"><p className="lux-text capitalize">{subject.name}</p><span className="lux-gold text-sm">{subject.progress}%</span></div><Progress value={subject.progress} className="h-1.5" /><p className="lux-dim mt-3 text-xs">{subject.quizzes} quiz sessions</p></div>)}</div> : <div className="lux-row py-12 text-center"><ClipboardList className="lux-dim mx-auto mb-3 size-8" /><p className="lux-dim">Your mastery map appears after the first quiz.</p></div>}
          </motion.section>

          <motion.section {...fade(0.26)} className="lux-panel p-6 md:p-8">
            <div className="mb-6"><p className="lux-eyebrow">Focus queue</p><h2 className="lux-text mt-2 text-2xl">Next best move</h2></div>
            <div className="space-y-3">
              {weakTopics.length ? weakTopics.map((topic) => <Link key={`${topic.subject}-${topic.topic}`} to="/notes" className="lux-row flex items-center gap-3 p-4"><Lightbulb className="size-4 shrink-0 lux-gold" /><div className="min-w-0 flex-1"><p className="lux-text truncate text-sm">Revise {topic.topic}</p><p className="lux-dim mt-1 text-xs">{topic.subject}</p></div><span className="lux-accent text-sm">{topic.score}%</span></Link>) : <div className="lux-row p-5"><CheckCircle2 className="lux-gold mb-4 size-5" /><p className="lux-text text-sm">No weak areas detected.</p><p className="lux-dim mt-1 text-xs">Keep your momentum going.</p></div>}
            </div>
          </motion.section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <motion.section {...fade(0.3)} className="lux-panel p-6 md:p-8">
            <div className="mb-6"><p className="lux-eyebrow">Launch deck</p><h2 className="lux-text mt-2 text-2xl">Quick actions</h2></div>
            <div className="grid grid-cols-2 gap-3">{quickActions.map((action) => { const Icon = action.icon; return <Link key={action.to} to={action.to} className="lux-row group min-h-32 p-4"><Icon className="size-5 lux-gold" /><p className="lux-text mt-8 text-sm">{action.label}</p><ArrowRight className="lux-dim mt-2 size-4 transition-transform group-hover:translate-x-1" /></Link>; })}</div>
          </motion.section>
          <motion.section {...fade(0.34)} className="lux-panel p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between"><div><p className="lux-eyebrow">Activity ledger</p><h2 className="lux-text mt-2 text-2xl">Recent work</h2></div><Sparkles className="size-5 lux-gold" /></div>
            <div className="space-y-2">{activities.length ? activities.map((item, index) => { const Icon = item.icon; return <div key={`${item.title}-${index}`} className="lux-row flex items-center gap-4 p-4"><Icon className="lux-gold size-4 shrink-0" /><div className="min-w-0 flex-1"><p className="lux-text truncate text-sm">{item.title}</p><p className="lux-dim mt-1 text-xs">{item.subject} · {item.meta}</p></div><span className="lux-dim text-[10px]">{getTimeAgo(item.date)}</span></div>; }) : <div className="lux-row py-12 text-center"><Activity className="lux-dim mx-auto mb-3 size-8" /><p className="lux-dim text-sm">Your recent work will appear here.</p></div>}</div>
          </motion.section>
        </div>

        <motion.footer {...fade(0.38)} className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/10 bg-border/10">
          {[{ label: "notes", value: notesCount }, { label: "flashcards", value: flashcardsCount }, { label: "quizzes", value: totalQuizzes }].map((item) => <div key={item.label} className="bg-background/20 p-5 text-center backdrop-blur-xl"><p className="lux-text text-2xl">{item.value}</p><p className="lux-eyebrow mt-2">{item.label}</p></div>)}
        </motion.footer>
      </div>
    </div>
  );
};

function getTimeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default Dashboard;
