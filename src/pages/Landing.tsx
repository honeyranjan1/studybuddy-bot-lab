import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BookOpen, MessageSquare, BarChart3, Trophy, ArrowRight, Zap, Target,
  FileText, Briefcase, Users, Brain, Sparkles, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: FileText, title: "Generate Notes", description: "AI creates structured, exam-ready study notes from any topic instantly.", color: "from-indigo-500 to-blue-500" },
  { icon: Brain, title: "Practice Quiz", description: "AI-generated quizzes that adapt to your weak areas and track progress.", color: "from-emerald-500 to-teal-500" },
  { icon: Users, title: "Find Study Partner", description: "Smart matching connects you with partners who share your goals & schedule.", color: "from-rose-500 to-pink-500" },
  { icon: BarChart3, title: "Track Progress", description: "Visualize growth with detailed dashboards, streaks, and insights.", color: "from-purple-500 to-fuchsia-500" },
  { icon: FileText, title: "PDF Summary Tool", description: "Upload any PDF — get summaries, key points, and flashcards in seconds.", color: "from-orange-500 to-amber-500" },
  { icon: Briefcase, title: "Placement Mode", description: "DSA tracker, mock interviews, coding checklists — all in one place.", color: "from-sky-500 to-blue-600" },
];

const howItWorks = [
  { step: "1", title: "Enter Subject", description: "Pick any topic or subject you want to study." },
  { step: "2", title: "Generate Notes", description: "AI creates structured notes, flashcards, or quizzes." },
  { step: "3", title: "Practice Quiz", description: "Test your knowledge with adaptive questions." },
  { step: "4", title: "Track Progress", description: "Monitor streaks, XP, and weak areas." },
];

const whyUs = [
  { icon: Zap, title: "Saves Study Time", description: "Generate notes and flashcards in seconds, not hours." },
  { icon: Brain, title: "Improves Retention", description: "Spaced repetition and active recall built in." },
  { icon: Briefcase, title: "Placement Ready", description: "DSA tracking, mock interviews, and coding checklists." },
  { icon: Target, title: "Structured Revision", description: "AI identifies weak topics and builds a revision plan." },
];

const Landing = () => {
  const { session, profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
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
              AI-Powered Study Platform for Engineers
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              {session && firstName ? (
                <>Welcome back, {firstName}! <br />Your <span className="text-gradient">AI Study Partner</span> awaits</>
              ) : (
                <>Your AI-powered study partner for <span className="text-gradient">smarter learning</span> and placement preparation</>
              )}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {session
                ? "Pick up where you left off — generate notes, practice quizzes, or prep for placements."
                : "Generate notes, practice quizzes, find study partners, and track your progress — all in one place."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={session ? "/chat" : "/signup"}>
                <Button variant="hero" size="lg" className="text-base px-8 py-6">
                  Start Studying Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to={session ? "/partners" : "/signup"}>
                <Button variant="outline" size="lg" className="text-base px-8 py-6">
                  <Users className="w-5 h-5 mr-1" />
                  Find Study Partner
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
                  <p className="font-display font-semibold text-foreground">StudyBuddy AI Tutor</p>
                  <p className="text-xs text-muted-foreground">Online • Ready to help</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
                    <p className="text-sm text-secondary-foreground">Hi! 👋 Ready to study? I can generate notes, create flashcards, or help with DSA prep!</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="gradient-hero rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
                    <p className="text-sm text-primary-foreground">Generate notes on Binary Search Trees!</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3 max-w-sm">
                    <p className="text-sm text-secondary-foreground">Great choice! 🎯 Here are structured notes on BST — covering insertion, deletion, traversal, and time complexities... 🌳</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full gradient-hero border-2 border-card flex items-center justify-center text-xs text-primary-foreground font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">100+</span> engineering students</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Helps improve <span className="font-semibold text-foreground">retention & revision speed</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Placement ready</span> preparation</p>
            </div>
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
              AI-powered tools designed specifically for engineering students and placement preparation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-card border-y border-border">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">Get started in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4 text-xl font-display font-bold text-primary-foreground">
                  {item.step}
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why StudyBuddy AI */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
              Why <span className="text-gradient">StudyBuddy AI</span>?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {whyUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl border border-border bg-card hover:shadow-card transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
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
                Join 100+ engineering students who are already learning smarter with AI-powered tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={session ? "/chat" : "/signup"}>
                  <Button variant="accent" size="lg" className="text-base px-8 py-6">
                    Start Learning Now
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                <Link to={session ? "/placement" : "/signup"}>
                  <Button variant="outline" size="lg" className="text-base px-8 py-6 bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20">
                    <Briefcase className="w-5 h-5 mr-1" />
                    Placement Mode
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white shadow-soft overflow-hidden flex items-center justify-center">
              <img src={logo} alt="StudyBuddy AI" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-foreground">StudyBuddy AI</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">© 2026 StudyBuddy AI. Making learning personal.</p>
            <p className="text-xs text-muted-foreground mt-1">Built by Honey Ranjan, Satyam Pandey, Siddhant Singh, Suryansh & Nikhil Singh</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
