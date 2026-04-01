import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  BarChart3,
  Trophy,
  Sparkles,
  ArrowRight,
  BookOpen,
  Zap,
  Target,
  Users,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Tutor Chat",
    description: "Get instant help on any topic with our conversational AI that adapts to your learning style.",
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "Smart algorithms track your strengths and weaknesses, tailoring lessons just for you.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Visualize your growth with detailed dashboards and exportable progress reports.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Stay motivated with badges, streaks, XP points, and achievement milestones.",
  },
  {
    icon: Zap,
    title: "Dynamic Quizzes",
    description: "AI-generated quizzes adapt in difficulty based on your real-time performance.",
  },
  {
    icon: Target,
    title: "Step-by-Step Solutions",
    description: "Break down complex problems into clear, digestible steps with detailed explanations.",
  },
];

const subjects = [
  { name: "Mathematics", emoji: "📐", color: "bg-primary/10 text-primary" },
  { name: "Science", emoji: "🔬", color: "bg-accent/10 text-accent" },
  { name: "English", emoji: "📝", color: "bg-primary/10 text-primary" },
  { name: "History", emoji: "🏛️", color: "bg-accent/10 text-accent" },
  { name: "Coding", emoji: "💻", color: "bg-primary/10 text-primary" },
  { name: "Languages", emoji: "🌍", color: "bg-accent/10 text-accent" },
];

const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "1M+", label: "Lessons Completed" },
  { value: "95%", label: "Satisfaction Rate" },
  { value: "200+", label: "Subjects Covered" },
];

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-surface opacity-60" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse-glow" />

        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              Learn Smarter with Your{" "}
              <span className="text-gradient">AI Tutor</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Personalized lessons, adaptive quizzes, and real-time feedback — all powered by AI that understands how you learn best.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/chat">
                <Button variant="hero" size="lg" className="text-base px-8 py-6">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="text-base px-8 py-6">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-2xl mx-auto mt-16"
          >
            <div className="bg-card rounded-2xl shadow-elevated border border-border p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">LearnAI Tutor</p>
                  <p className="text-xs text-muted-foreground">Online • Ready to help</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
                    <p className="text-sm text-secondary-foreground">Hi Alex! 👋 Ready to learn today? What subject do you want to work on?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="gradient-hero rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
                    <p className="text-sm text-primary-foreground">Help me understand fractions!</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3 max-w-sm">
                    <p className="text-sm text-secondary-foreground">Great choice! 🎯 Let's start with the basics. A fraction represents a part of a whole. Think of it like slicing a pizza... 🍕</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-display font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
              Everything You Need to <span className="text-gradient">Excel</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our AI-powered platform combines the best of personalized tutoring with cutting-edge technology.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-elevated transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-24 px-4 bg-card border-y border-border">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
              Learn Any Subject
            </h2>
            <p className="text-muted-foreground text-lg">Pick a subject and start learning instantly.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {subjects.map((subject, i) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-background hover:shadow-card transition-all cursor-pointer group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{subject.emoji}</span>
                <span className="text-sm font-medium text-foreground">{subject.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="gradient-hero rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students who are already learning smarter with AI-powered personalized tutoring.
              </p>
              <Link to="/chat">
                <Button variant="accent" size="lg" className="text-base px-8 py-6">
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">LearnAI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 LearnAI. Making learning personal.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
