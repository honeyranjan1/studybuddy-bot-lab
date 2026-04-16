import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Trophy, Target, BookOpen, TrendingUp, Star, MessageSquare, ArrowRight, Award, Zap, ClipboardList, Calendar, AlertTriangle, Briefcase, FileText, Layers,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const badges = [
  { name: "First Lesson", icon: Star, minXp: 0 },
  { name: "Quiz Master", icon: Trophy, minQuizzes: 5 },
  { name: "7-Day Streak", icon: Flame, minStreak: 7 },
  { name: "Perfect Score", icon: Target, needsPerfect: true },
  { name: "Speed Learner", icon: Zap, minXp: 200 },
  { name: "Top Student", icon: Award, minXp: 1000 },
];

const Dashboard = () => {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Student";

  const { data: streak } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("learning_streaks").select("*").eq("user_id", user!.id).single();
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
  const hasPerfect = quizResults?.some((q) => q.score === 100) || false;

  // Weak topics (scored below 60%)
  const weakTopics = quizResults?.filter(q => q.score < 60).slice(0, 3).map(q => ({ topic: q.topic, subject: q.subject, score: q.score })) || [];

  // Subject progress
  const subjectMap: Record<string, { total: number; correct: number; count: number }> = {};
  quizResults?.forEach((q) => {
    if (!subjectMap[q.subject]) subjectMap[q.subject] = { total: 0, correct: 0, count: 0 };
    subjectMap[q.subject].total += q.total_questions;
    subjectMap[q.subject].correct += q.correct_answers;
    subjectMap[q.subject].count += 1;
  });

  const subjectIcons: Record<string, string> = { mathematics: "📐", science: "🔬", english: "📝", coding: "💻", history: "📜", geography: "🌍", electronics: "⚡", dbms: "🗄️", os: "🖥️" };
  const subjectList = Object.entries(subjectMap).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    progress: Math.round((data.correct / data.total) * 100),
    quizzes: data.count,
    icon: subjectIcons[name] || "📚",
  }));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = dayNames.map((day, i) => {
    const dayQuizzes = quizResults?.filter((q) => new Date(q.created_at).getDay() === i) || [];
    const avg = dayQuizzes.length > 0 ? Math.round(dayQuizzes.reduce((s, q) => s + q.score, 0) / dayQuizzes.length) : 0;
    return { day, score: avg };
  });

  const recentActivity = (quizResults || []).slice(0, 5).map((q) => ({
    subject: q.subject,
    topic: q.topic,
    score: q.score,
    time: getTimeAgo(new Date(q.created_at)),
  }));

  const earnedBadges = badges.map((b) => {
    let earned = false;
    if ("minXp" in b) earned = (streak?.total_xp || 0) >= b.minXp!;
    if ("minQuizzes" in b) earned = totalQuizzes >= b.minQuizzes!;
    if ("minStreak" in b) earned = (streak?.current_streak || 0) >= b.minStreak!;
    if ("needsPerfect" in b) earned = hasPerfect;
    return { ...b, earned };
  });

  const getDaysRemaining = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground">Here's your learning progress. Keep it up!</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Day Streak", value: streak?.current_streak?.toString() || "0", icon: Flame, color: "text-orange-500" },
            { label: "XP Points", value: (streak?.total_xp || 0).toLocaleString(), icon: Zap, color: "text-primary" },
            { label: "Quizzes Done", value: totalQuizzes.toString(), icon: Target, color: "text-accent" },
            { label: "Avg Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-green-500" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="p-4 border-border hover:shadow-card transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Today's Progress + Exam Countdown */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Progress */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
            <Card className="p-6 border-border">
              <h2 className="font-display font-semibold text-lg mb-4 text-foreground">📊 Today's Progress</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{totalQuizzes}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Taken</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{notesCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Notes Created</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{flashcardsCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Flashcards</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">{weakTopics.length}</p>
                  <p className="text-xs text-muted-foreground">⚠️ Weak Topics</p>
                </div>
              </div>
              {weakTopics.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-accent" /> Weak Topics Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {weakTopics.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-accent/20 text-xs font-medium text-foreground">{t.topic} ({t.score}%)</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Exam Countdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg text-foreground">📅 Exams</h2>
                <Link to="/exam-countdown"><Button variant="ghost" size="sm" className="text-primary text-xs">View All</Button></Link>
              </div>
              {examCountdowns && examCountdowns.length > 0 ? (
                <div className="space-y-3">
                  {examCountdowns.map(exam => {
                    const days = getDaysRemaining(exam.exam_date);
                    return (
                      <div key={exam.id} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground ${days <= 7 ? "gradient-accent" : "gradient-hero"}`}>
                          {days < 0 ? "✓" : days}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{exam.exam_name}</p>
                          <p className="text-xs text-muted-foreground">{days < 0 ? "Done" : `${days} day${days !== 1 ? "s" : ""} left`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming exams</p>
                  <Link to="/exam-countdown"><Button variant="ghost" size="sm" className="mt-1 text-xs text-primary">Add Exam</Button></Link>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <Card className="p-6 border-border">
            <h2 className="font-display font-semibold text-lg mb-4 text-foreground">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: "/notes", label: "Generate Notes", icon: FileText, color: "bg-primary/10 text-primary" },
                { to: "/flashcards", label: "Flashcards", icon: Layers, color: "bg-accent/10 text-accent" },
                { to: "/quiz", label: "Take Quiz", icon: ClipboardList, color: "bg-primary/10 text-primary" },
                { to: "/placement", label: "Placement Prep", icon: Briefcase, color: "bg-accent/10 text-accent" },
              ].map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.to} to={action.to}>
                    <div className={`p-4 rounded-xl border border-border hover:shadow-card transition-all text-center cursor-pointer`}>
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <Card className="p-6 border-border">
              <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Weekly Performance</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 65%, 38%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(168, 65%, 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 90%)" />
                  <XAxis dataKey="day" fontSize={12} stroke="hsl(200, 10%, 45%)" />
                  <YAxis fontSize={12} stroke="hsl(200, 10%, 45%)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="hsl(168, 65%, 38%)" fill="url(#scoreGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="p-6 border-border">
              <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Badges</h2>
              <div className="grid grid-cols-3 gap-3">
                {earnedBadges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.name} className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${badge.earned ? "bg-primary/10" : "bg-muted opacity-40"}`}>
                      <Icon className={`w-6 h-6 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[10px] font-medium text-foreground leading-tight">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Subject Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-foreground">Subject Progress</h2>
              <Link to="/quiz"><Button variant="ghost" size="sm" className="text-primary">Take a Quiz <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
            </div>
            {subjectList.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {subjectList.map((subject) => (
                  <div key={subject.name} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                    <span className="text-2xl">{subject.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{subject.name}</span>
                        <span className="text-xs text-muted-foreground">{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{subject.quizzes} quizzes completed</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No quizzes taken yet. Start your first quiz!</p>
                <Link to="/quiz"><Button variant="hero" size="sm" className="mt-3">Take a Quiz</Button></Link>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-6 border-border">
            <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">{item.subject} • {item.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{item.score}%</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No activity yet. Take your first quiz!</p>
            )}
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
          <div className="gradient-hero rounded-2xl p-8 text-center">
            <h3 className="font-display font-bold text-xl text-primary-foreground mb-2">Ready for your next challenge?</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">Take a quiz, generate notes, or prep for placements.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/quiz"><Button variant="accent" className="font-semibold"><ClipboardList className="w-4 h-4 mr-2" /> Take a Quiz</Button></Link>
              <Link to="/chat"><Button variant="accent" className="font-semibold"><MessageSquare className="w-4 h-4 mr-2" /> Chat with Tutor</Button></Link>
              <Link to="/placement"><Button variant="accent" className="font-semibold"><Briefcase className="w-4 h-4 mr-2" /> Placement Prep</Button></Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default Dashboard;
