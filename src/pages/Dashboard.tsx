import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Trophy, Target, BookOpen, TrendingUp, MessageSquare, ArrowRight, Zap,
  ClipboardList, Calendar, AlertTriangle, Briefcase, FileText, Layers, FileSearch,
  Sparkles, Activity, Lightbulb, ChevronRight, CheckCircle2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Student";

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

  // Today's activity
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayQuizzes = quizResults?.filter(q => new Date(q.created_at) >= todayStart).length || 0;

  // Weak topics (scored below 60%)
  const weakTopics = quizResults?.filter(q => q.score < 60).slice(0, 4).map(q => ({ topic: q.topic, subject: q.subject, score: q.score })) || [];

  // Subject progress
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

  // Weekly performance
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = dayNames.map((day, i) => {
    const dayQuizzes = quizResults?.filter((q) => new Date(q.created_at).getDay() === i) || [];
    const avg = dayQuizzes.length > 0 ? Math.round(dayQuizzes.reduce((s, q) => s + q.score, 0) / dayQuizzes.length) : 0;
    return { day, score: avg };
  });

  // Recent activity timeline (mix of quizzes + notes)
  type Activity = { type: "quiz" | "note"; title: string; subject: string; meta: string; date: Date; icon: typeof ClipboardList; color: string };
  const activities: Activity[] = [
    ...(quizResults || []).slice(0, 5).map((q): Activity => ({
      type: "quiz", title: `Completed quiz on ${q.topic}`, subject: q.subject,
      meta: `${q.score}% score`, date: new Date(q.created_at), icon: ClipboardList,
      color: q.score >= 70 ? "text-success bg-success/10" : "text-warning bg-warning/10",
    })),
    ...(recentNotes || []).slice(0, 5).map((n): Activity => ({
      type: "note", title: `Generated notes on ${n.topic}`, subject: n.subject,
      meta: "Notes", date: new Date(n.created_at), icon: FileText,
      color: "text-primary bg-primary/10",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  // AI recommendations
  const recommendations = [
    weakTopics[0] && { title: `Revise ${weakTopics[0].topic}`, desc: `You scored ${weakTopics[0].score}% — let's strengthen this`, icon: Lightbulb, to: "/notes" },
    { title: "Practice 5 MCQs", desc: "Quick warm-up to maintain your streak", icon: ClipboardList, to: "/quiz" },
    totalQuizzes > 0 && { title: "Continue learning", desc: `Try a new topic in ${quizResults![0].subject}`, icon: TrendingUp, to: "/quiz" },
  ].filter(Boolean).slice(0, 3) as { title: string; desc: string; icon: typeof Lightbulb; to: string }[];

  const getDaysRemaining = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const stats = [
    { label: "Day Streak", value: streak?.current_streak ?? 0, suffix: "days", icon: Flame, gradient: "from-orange-500 to-red-500" },
    { label: "XP Points", value: (streak?.total_xp ?? 0).toLocaleString(), icon: Zap, gradient: "from-yellow-400 to-orange-500" },
    { label: "Sessions Today", value: todayQuizzes, icon: Activity, gradient: "from-emerald-500 to-teal-500" },
    { label: "Avg Score", value: `${avgScore}%`, icon: Trophy, gradient: "from-indigo-500 to-purple-500" },
  ];

  const quickActions = [
    { to: "/notes", label: "Generate Notes", icon: FileText, color: "from-indigo-500 to-blue-500" },
    { to: "/quiz", label: "Practice Quiz", icon: ClipboardList, color: "from-emerald-500 to-teal-500" },
    { to: "/flashcards", label: "Flashcards", icon: Layers, color: "from-purple-500 to-pink-500" },
    { to: "/pdf-summary", label: "PDF Summary", icon: FileSearch, color: "from-orange-500 to-amber-500" },
    { to: "/partners", label: "Find Partner", icon: MessageSquare, color: "from-rose-500 to-red-500" },
    { to: "/chat", label: "Ask AI", icon: Sparkles, color: "from-sky-500 to-blue-600" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your learning command center.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/chat"><Button variant="outline" size="sm" className="gap-1.5"><MessageSquare className="w-4 h-4" /> Ask AI</Button></Link>
          <Link to="/quiz"><Button size="sm" className="gradient-hero shadow-soft border-0 text-primary-foreground gap-1.5">Start Session <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </motion.div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 md:p-5 border-border hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}{stat.suffix ? ` ${stat.suffix}` : ""}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to}>
                <Card className="p-3 md:p-4 border-border hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 text-center group cursor-pointer h-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 shadow-soft group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground leading-tight">{action.label}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Main grid: Performance + Side Panel */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Weekly chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="p-5 md:p-6 border-border h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-base text-foreground">Weekly Performance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Average quiz score by day</p>
              </div>
              <Badge variant="secondary" className="gap-1 bg-success/10 text-success hover:bg-success/15 border-0">
                <TrendingUp className="w-3 h-3" /> {avgScore}% avg
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#scoreGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Exam Countdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-5 md:p-6 border-border h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Upcoming Exams
              </h2>
              <Link to="/exam-countdown"><Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-primary">View all</Button></Link>
            </div>
            {examCountdowns && examCountdowns.length > 0 ? (
              <div className="space-y-2.5">
                {examCountdowns.map(exam => {
                  const days = getDaysRemaining(exam.exam_date);
                  const urgent = days <= 7 && days >= 0;
                  return (
                    <div key={exam.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-soft ${urgent ? "bg-gradient-to-br from-orange-500 to-red-500" : "gradient-hero"}`}>
                        <span className="text-base font-bold leading-none">{days < 0 ? "✓" : days}</span>
                        <span className="text-[9px] uppercase tracking-wide opacity-80 mt-0.5">{days < 0 ? "done" : "days"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{exam.exam_name}</p>
                        <p className="text-xs text-muted-foreground">{exam.subject || "Exam"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">No exams scheduled</p>
                <Link to="/exam-countdown"><Button size="sm" variant="outline" className="text-xs">Add exam</Button></Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* AI Recommendations + Weak Topics */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="p-5 md:p-6 border-border h-full bg-gradient-to-br from-primary/5 via-card to-accent/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-base text-foreground">Recommended for you</h2>
                <p className="text-xs text-muted-foreground">Personalized based on your activity</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <Link to={rec.to} key={i}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-5 md:p-6 border-border h-full">
            <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning" /> Weak Topics
            </h2>
            {weakTopics.length > 0 ? (
              <div className="space-y-2">
                {weakTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.topic}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{t.subject}</p>
                    </div>
                    <Badge variant="secondary" className="bg-warning/15 text-warning border-0 text-xs shrink-0">{t.score}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-success/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No weak areas detected. Keep it up!</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Subject Progress + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5 md:p-6 border-border h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base text-foreground">Subject Progress</h2>
              <Link to="/quiz"><Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-primary gap-1">Take quiz <ArrowRight className="w-3 h-3" /></Button></Link>
            </div>
            {subjectList.length > 0 ? (
              <div className="space-y-4">
                {subjectList.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground capitalize">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.progress}% • {s.quizzes} quiz{s.quizzes !== 1 ? "es" : ""}</span>
                    </div>
                    <Progress value={s.progress} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No quizzes yet</p>
                <Link to="/quiz"><Button size="sm" className="gradient-hero text-primary-foreground border-0">Take your first quiz</Button></Link>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="p-5 md:p-6 border-border h-full">
            <h2 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Activity
            </h2>
            {activities.length > 0 ? (
              <div className="space-y-1">
                {activities.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{a.subject} • {a.meta} • {getTimeAgo(a.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Quick stats footer */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: "Notes Created", value: notesCount || 0, icon: FileText },
          { label: "Flashcards", value: flashcardsCount || 0, icon: Layers },
          { label: "Quizzes Taken", value: totalQuizzes, icon: ClipboardList },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>
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
