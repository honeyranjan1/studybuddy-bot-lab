import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Flame,
  Trophy,
  Target,
  BookOpen,
  TrendingUp,
  Star,
  MessageSquare,
  ArrowRight,
  Award,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 78 },
  { day: "Thu", score: 90 },
  { day: "Fri", score: 88 },
  { day: "Sat", score: 95 },
  { day: "Sun", score: 82 },
];

const subjects = [
  { name: "Mathematics", progress: 68, lessons: 24, icon: "📐" },
  { name: "Science", progress: 45, lessons: 15, icon: "🔬" },
  { name: "English", progress: 82, lessons: 31, icon: "📝" },
  { name: "Coding", progress: 55, lessons: 18, icon: "💻" },
];

const badges = [
  { name: "First Lesson", icon: Star, earned: true },
  { name: "Quiz Master", icon: Trophy, earned: true },
  { name: "7-Day Streak", icon: Flame, earned: true },
  { name: "Perfect Score", icon: Target, earned: false },
  { name: "Speed Learner", icon: Zap, earned: true },
  { name: "Top Student", icon: Award, earned: false },
];

const recentActivity = [
  { subject: "Math", topic: "Fractions — Adding & Subtracting", score: 90, time: "2h ago" },
  { subject: "Science", topic: "Newton's Laws of Motion", score: 85, time: "5h ago" },
  { subject: "English", topic: "Essay Writing — Introduction", score: 78, time: "1d ago" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Welcome back, Alex! 👋
          </h1>
          <p className="text-muted-foreground">Here's your learning progress. Keep it up!</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Day Streak", value: "12", icon: Flame, color: "text-orange-500" },
            { label: "XP Points", value: "2,450", icon: Zap, color: "text-primary" },
            { label: "Quizzes Done", value: "47", icon: Target, color: "text-accent" },
            { label: "Avg Score", value: "85%", icon: TrendingUp, color: "text-green-500" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
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

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
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

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border-border">
              <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Badges</h2>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.name}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${
                        badge.earned ? "bg-primary/10" : "bg-muted opacity-40"
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[10px] font-medium text-foreground leading-tight">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Subjects Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-foreground">Subject Progress</h2>
              <Link to="/chat">
                <Button variant="ghost" size="sm" className="text-primary">
                  Continue Learning <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <div key={subject.name} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                  <span className="text-2xl">{subject.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{subject.name}</span>
                      <span className="text-xs text-muted-foreground">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{subject.lessons} lessons completed</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 border-border">
            <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Recent Activity</h2>
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
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="gradient-hero rounded-2xl p-8 text-center">
            <h3 className="font-display font-bold text-xl text-primary-foreground mb-2">Ready for your next lesson?</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">Your AI tutor is waiting to help you learn something new.</p>
            <Link to="/chat">
              <Button variant="accent" className="font-semibold">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Chatting
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
