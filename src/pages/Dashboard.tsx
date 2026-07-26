import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Trophy, TrendingUp, MessageSquare, ArrowRight, Zap,
  ClipboardList, Calendar, AlertTriangle, FileText, Layers, FileSearch,
  Sparkles, Activity, Lightbulb, ChevronRight, CheckCircle2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "student";

  const { data: streak } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("learning_streaks").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: quizResults } = useQuery({
    queryKey: ["quizResults", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_results").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: examCountdowns } = useQuery({
    queryKey: ["examCountdowns", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("exam_countdowns").select("*").eq("user_id", user!.id).eq("is_active", true).order("exam_date", { ascending: true }).limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentNotes } = useQuery({
    queryKey: ["recentNotes", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("generated_notes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: notesCount } = useQuery({
    queryKey: ["notesCount", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("generated_notes").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: flashcardsCount } = useQuery({
    queryKey: ["flashcardsCount", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const totalQuizzes = quizResults?.length || 0;
  const avgScore = totalQuizzes > 0 ? Math.round(quizResults!.reduce((s, q) => s + q.score, 0) / totalQuizzes) : 0;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayQuizzes = quizResults?.filter(q => new Date(q.created_at) >= todayStart).length || 0;

  const weakTopics = quizResults?.filter(q => q.score < 60).slice(0, 4).map(q => ({ topic: q.topic, subject: q.subject, score: q.score })) || [];

  const subjectMap: Record<string, { total: number; correct: number; count: number }> = {};
  quizResults?.forEach((q) => {
    if (!subjectMap[q.subject]) subjectMap[q.subject] = { total: 0, correct: 0, count: 0 };
    subjectMap[q.subject].total += q.total_questions;
    subjectMap[q.subject].correct += q.correct_answers;
    subjectMap[q.subject].count += 1;
  });
  const subjectList = Object.entries(subjectMap).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    progress: Math.round((data.correct / data.total) * 100),
    quizzes: data.count,
  })).slice(0, 4);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = dayNames.map((day, i) => {
    const dayQuizzes = quizResults?.filter((q) => new Date(q.created_at).getDay() === i) || [];
    const avg = dayQuizzes.length > 0 ? Math.round(dayQuizzes.reduce((s, q) => s + q.score, 0) / dayQuizzes.length) : 0;
    return { day, score: avg };
  });

  type Activity = { type: "quiz" | "note"; title: string; subject: string; meta: string; date: Date; icon: typeof ClipboardList };
  const activities: Activity[] = [
    ...(quizResults || []).slice(0, 5).map((q): Activity => ({
      type: "quiz", title: `Completed quiz on ${q.topic}`, subject: q.subject,
      meta: `${q.score}% score`, date: new Date(q.created_at), icon: ClipboardList,
    })),
    ...(recentNotes || []).slice(0, 5).map((n): Activity => ({
      type: "note", title: `Generated notes on ${n.topic}`, subject: n.subject,
      meta: "Notes", date: new Date(n.created_at), icon: FileText,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  const recommendations = [
    weakTopics[0] && { title: `revise ${weakTopics[0].topic}`, desc: `you scored ${weakTopics[0].score}% — let's strengthen this`, icon: Lightbulb, to: "/notes" },
    { title: "practice 5 mcqs", desc: "quick warm-up to maintain your streak", icon: ClipboardList, to: "/quiz" },
    totalQuizzes > 0 && { title: "continue learning", desc: `try a new topic in ${quizResults![0].subject}`, icon: TrendingUp, to: "/quiz" },
  ].filter(Boolean).slice(0, 3) as { title: string; desc: string; icon: typeof Lightbulb; to: string }[];

  const getDaysRemaining = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const stats = [
    { label: "day streak", value: streak?.current_streak ?? 0, icon: Flame },
    { label: "xp points", value: (streak?.total_xp ?? 0).toLocaleString(), icon: Zap },
    { label: "sessions today", value: todayQuizzes, icon: Activity },
    { label: "avg score", value: `${avgScore}%`, icon: Trophy },
  ];

  const quickActions = [
    { to: "/notes", label: "generate notes", icon: FileText },
    { to: "/quiz", label: "practice quiz", icon: ClipboardList },
    { to: "/flashcards", label: "flashcards", icon: Layers },
    { to: "/pdf-summary", label: "pdf summary", icon: FileSearch },
    { to: "/partners", label: "find partner", icon: MessageSquare },
    { to: "/chat", label: "ask ai", icon: Sparkles },
  ];

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
      {/* Editorial hero header */}
      <motion.div {...fade(0)} className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e]">dashboard</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          <span className="text-xs text-[#8e8e8e] lowercase">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-[#1a1a1a]">
          welcome back,
          <br />
          <span className="text-[#8e8e8e]">{displayName}.</span>{" "}
          <span className="inline-flex items-center justify-center w-[42px] md:w-[62px] h-[24px] md:h-[36px] border-2 border-[#1a1a1a] rounded-full align-middle mx-1">
            <span className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
          </span>
        </h1>
        <p className="mt-4 text-[#8e8e8e] text-base md:text-lg max-w-xl">
          your learning command center — resume where you left off, or start something new.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/quiz"><Pill variant="solid">start session →</Pill></Link>
          <Link to="/chat"><Pill variant="glass"><MessageSquare className="w-4 h-4" /> ask ai</Pill></Link>
        </div>
      </motion.div>

      {/* Stats — editorial numbers row */}
      <motion.div {...fade(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]/10 rounded-3xl overflow-hidden mb-10 border border-[#1a1a1a]/10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-bg-base p-6 md:p-8 hover:bg-white/60 transition-colors">
              <Icon className="w-4 h-4 text-[#8e8e8e] mb-6" />
              <p className="font-display text-4xl md:text-5xl tracking-tight text-[#1a1a1a] leading-none">{stat.value}</p>
              <p className="text-xs text-[#8e8e8e] mt-3 lowercase tracking-wide">{stat.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fade(0.15)} className="mb-10">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="font-display text-2xl text-[#1a1a1a]">quick actions</h2>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to}>
                <div className="glass rounded-2xl p-5 hover:bg-white/80 hover:-translate-y-0.5 transition-all group h-full">
                  <Icon className="w-5 h-5 text-[#1a1a1a] mb-8" />
                  <p className="text-sm text-[#1a1a1a] lowercase">{action.label}</p>
                  <ArrowRight className="w-4 h-4 text-[#8e8e8e] mt-2 group-hover:translate-x-0.5 group-hover:text-[#1a1a1a] transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Chart + Exams */}
      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        <motion.div {...fade(0.2)} className="lg:col-span-2">
          <Card className="glass border-white/60 rounded-3xl p-6 md:p-8 h-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl text-[#1a1a1a]">weekly performance</h2>
                <p className="text-xs text-[#8e8e8e] mt-1 lowercase">average quiz score by day</p>
              </div>
              <Badge variant="secondary" className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a] border-0 rounded-full gap-1">
                <TrendingUp className="w-3 h-3" /> {avgScore}%
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.08)" vertical={false} />
                <XAxis dataKey="day" fontSize={11} stroke="#8e8e8e" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#8e8e8e" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(26,26,26,0.1)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="#1a1a1a" fill="url(#scoreGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div {...fade(0.25)}>
          <Card className="glass border-white/60 rounded-3xl p-6 md:p-8 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-[#1a1a1a] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> upcoming exams
              </h2>
              <Link to="/exam-countdown" className="text-xs text-[#8e8e8e] hover:text-[#1a1a1a] lowercase">view all</Link>
            </div>
            {examCountdowns && examCountdowns.length > 0 ? (
              <div className="space-y-2">
                {examCountdowns.map(exam => {
                  const days = getDaysRemaining(exam.exam_date);
                  return (
                    <div key={exam.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 hover:bg-white/70 transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] text-white flex flex-col items-center justify-center shrink-0">
                        <span className="font-display text-xl leading-none">{days < 0 ? "✓" : days}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-70 mt-1">{days < 0 ? "done" : "days"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1a1a1a] truncate">{exam.exam_name}</p>
                        <p className="text-xs text-[#8e8e8e] lowercase">{exam.subject || "exam"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-[#8e8e8e]/40 mx-auto mb-3" />
                <p className="text-xs text-[#8e8e8e] mb-4 lowercase">no exams scheduled</p>
                <Link to="/exam-countdown"><Pill variant="outline">add exam</Pill></Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recommendations + Weak topics */}
      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        <motion.div {...fade(0.3)} className="lg:col-span-2">
          <Card className="glass border-white/60 rounded-3xl p-6 md:p-8 h-full">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#1a1a1a]" />
              <h2 className="font-display text-xl text-[#1a1a1a]">recommended for you</h2>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <Link to={rec.to} key={i}>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 hover:bg-white/80 border border-transparent hover:border-[#1a1a1a]/10 transition-all group">
                      <Icon className="w-4 h-4 text-[#1a1a1a] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1a1a1a]">{rec.title}</p>
                        <p className="text-xs text-[#8e8e8e] lowercase">{rec.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#1a1a1a] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div {...fade(0.35)}>
          <Card className="glass border-white/60 rounded-3xl p-6 md:p-8 h-full">
            <h2 className="font-display text-xl text-[#1a1a1a] flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4" /> weak topics
            </h2>
            {weakTopics.length > 0 ? (
              <div className="space-y-2">
                {weakTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/40">
                    <div className="min-w-0">
                      <p className="text-sm text-[#1a1a1a] truncate">{t.topic}</p>
                      <p className="text-[11px] text-[#8e8e8e] lowercase">{t.subject}</p>
                    </div>
                    <Badge className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a] border-0 text-xs rounded-full">{t.score}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-[#1a1a1a]/20 mx-auto mb-2" />
                <p className="text-xs text-[#8e8e8e] lowercase">no weak areas. keep it up!</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Subject progress + Activity */}
      <div className="grid lg:grid-cols-2 gap-4 mb-10">
        <motion.div {...fade(0.4)}>
          <Card className="glass border-white/60 rounded-3xl p-6 md:p-8 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-[#1a1a1a]">subject progress</h2>
              <Link to="/quiz" className="text-xs text-[#8e8e8e] hover:text-[#1a1a1a] lowercase flex items-center gap-1">take quiz <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {subjectList.length > 0 ? (
              <div className="space-y-5">
                {subjectList.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#1a1a1a] lowercase">{s.name}</span>
                      <span className="text-xs text-[#8e8e8e] lowercase">{s.progress}% · {s.quizzes} quiz{s.quizzes !== 1 ? "es" : ""}</span>
                    </div>
                    <Progress value={s.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ClipboardList className="w-10 h-10 text-[#8e8e8e]/40 mx-auto mb-3" />
                <p className="text-sm text-[#8e8e8e] mb-4 lowercase">no quizzes yet</p>
                <Link to="/quiz"><Pill variant="solid">take your first quiz</Pill></Link>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...fade(0.45)}>
          <Card className="glass border-white/60 rounded-3xl p-6 md:p-8 h-full">
            <h2 className="font-display text-xl text-[#1a1a1a] mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4" /> recent activity
            </h2>
            {activities.length > 0 ? (
              <div className="space-y-1">
                {activities.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/60 transition-colors">
                      <Icon className="w-4 h-4 text-[#1a1a1a] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1a1a1a] truncate">{a.title}</p>
                        <p className="text-[11px] text-[#8e8e8e] lowercase">{a.subject} · {a.meta} · {getTimeAgo(a.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Activity className="w-10 h-10 text-[#8e8e8e]/40 mx-auto mb-2" />
                <p className="text-sm text-[#8e8e8e] lowercase">no activity yet</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Footer stats */}
      <motion.div {...fade(0.5)} className="grid grid-cols-3 gap-3">
        {[
          { label: "notes created", value: notesCount || 0, icon: FileText },
          { label: "flashcards", value: flashcardsCount || 0, icon: Layers },
          { label: "quizzes taken", value: totalQuizzes, icon: ClipboardList },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-2xl p-5 flex items-center gap-4">
              <Icon className="w-4 h-4 text-[#8e8e8e]" />
              <div>
                <p className="font-display text-2xl text-[#1a1a1a] leading-none">{s.value}</p>
                <p className="text-[11px] text-[#8e8e8e] mt-1.5 lowercase">{s.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default Dashboard;
