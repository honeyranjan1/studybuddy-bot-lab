import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, Brain, Users, BarChart3, Briefcase, Layers,
  ArrowRight, Zap, Target, Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: FileText, title: "Generate notes", description: "AI creates structured, exam-ready notes from any topic instantly." },
  { icon: Brain, title: "Practice quizzes", description: "Adaptive quizzes that focus on your weak areas and track progress." },
  { icon: Layers, title: "Flashcards", description: "Spaced-repetition cards to lock in what matters, fast." },
  { icon: Users, title: "Study partners", description: "Match with peers who share your goals and schedule." },
  { icon: BarChart3, title: "Track progress", description: "Streaks, XP, and dashboards that show real growth." },
  { icon: Briefcase, title: "Placement mode", description: "DSA tracker, mock interviews, coding checklists." },
];

const steps = [
  { n: "01", t: "pick a topic", d: "Tell StudyBuddy what you're working on." },
  { n: "02", t: "generate", d: "Notes, flashcards, or a quiz — in seconds." },
  { n: "03", t: "practice", d: "Adaptive questions that fill your gaps." },
  { n: "04", t: "track", d: "Watch streaks, XP, and mastery climb." },
];

const whyUs = [
  { icon: Zap, title: "saves study time" },
  { icon: Brain, title: "improves retention" },
  { icon: Briefcase, title: "placement ready" },
  { icon: Target, title: "structured revision" },
];

const Index = () => {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-bg-base selection:bg-brand-green selection:text-black">
      <Navbar />
      <Hero />

      {/* Marquee-ish stat strip */}
      <section className="py-10 border-y border-black/5 bg-white/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6 text-sm text-[#1a1a1a]/70 lowercase tracking-wide">
          <span>100+ engineering students</span>
          <span className="hidden md:inline">•</span>
          <span>1,200+ notes generated</span>
          <span className="hidden md:inline">•</span>
          <span>3,400+ quizzes solved</span>
          <span className="hidden md:inline">•</span>
          <span>placement-ready toolkit</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6 mb-16">
            <div className="col-span-12 md:col-span-6">
              <div className="inline-flex items-center gap-2 text-xs lowercase text-[#1a1a1a]/60 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> a real study platform
              </div>
              <h2 className="font-display font-medium tracking-tight text-4xl md:text-6xl leading-[1.05] text-[#1a1a1a]">
                everything you need
                <br />
                to <span className="text-[#8e8e8e]">learn deeply and</span>
                <br />
                <span className="text-[#8e8e8e]">place confidently.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-5 md:col-start-8 flex md:items-end">
              <p className="text-[#4a4a4a] text-base md:text-lg leading-relaxed">
                Notes, quizzes, flashcards, DSA drills, and an AI tutor — designed for engineering students who want structure, not clutter.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative bg-white rounded-3xl p-7 border border-black/5 hover:border-black/10 hover:shadow-elevated transition-all"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#1a1a1a] text-white flex items-center justify-center mb-6 group-hover:bg-brand-green group-hover:text-black transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl text-[#1a1a1a] mb-2 lowercase">{f.title}</h3>
                  <p className="text-sm text-[#6a6a6a] leading-relaxed">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 px-6 bg-white/60 border-y border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-xs lowercase text-[#1a1a1a]/60 mb-3">how it works</p>
            <h2 className="font-display text-4xl md:text-5xl text-[#1a1a1a] lowercase tracking-tight">four steps. one flow.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-t border-[#1a1a1a] pt-6"
              >
                <p className="text-xs text-[#1a1a1a]/60 mb-8">{s.n}</p>
                <h3 className="font-display text-2xl text-[#1a1a1a] mb-2 lowercase">{s.t}</h3>
                <p className="text-sm text-[#6a6a6a]">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <h2 className="font-display text-4xl md:text-5xl text-[#1a1a1a] tracking-tight lowercase mb-6">
              why <span className="text-[#8e8e8e]">studybuddy</span>?
            </h2>
            <p className="text-[#4a4a4a] text-base leading-relaxed max-w-md">
              Built by students for students. No fluff, no dark patterns — just tools that turn scattered hours into steady progress.
            </p>
          </div>
          <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-4">
            {whyUs.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="p-6 rounded-3xl border border-black/5 bg-white flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#1a1a1a]" />
                  </div>
                  <p className="text-sm lowercase text-[#1a1a1a]">{w.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto rounded-[2.5rem] bg-[#1a1a1a] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-green/20 blur-3xl" />
          <div className="relative z-10 grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-8">
              <h2 className="font-display text-4xl md:text-6xl text-white lowercase tracking-tight leading-[1.05]">
                ready to study
                <br />
                <span className="text-brand-green">smarter?</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-4 flex md:items-end md:justify-end gap-3 flex-wrap">
              <Link
                to={session ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 bg-brand-green text-black rounded-full px-6 py-3.5 text-sm font-medium hover:shadow-glow transition-all"
              >
                start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 rounded-full px-6 py-3.5 text-sm hover:bg-white/20 transition"
              >
                explore tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10">
        <div className="max-w-7xl mx-auto pt-10 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="w-6 h-6" fill="#1a1a1a" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2c2.8 0 5 2.2 5 5 0 1.3-.5 2.5-1.3 3.4C22 10.9 24 13 24 15.5c0 2.5-2 4.6-4.3 5.1.9.9 1.3 2.1 1.3 3.4 0 2.8-2.2 5-5 5s-5-2.2-5-5c0-1.3.5-2.5 1.3-3.4C10 20.1 8 18 8 15.5S10 10.9 12.3 10.4C11.5 9.5 11 8.3 11 7c0-2.8 2.2-5 5-5z" />
            </svg>
            <span className="font-display text-lg text-[#1a1a1a] lowercase">studybuddy</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs text-[#6a6a6a]">© 2026 StudyBuddy AI. Made for engineering students.</p>
            <p className="text-xs text-[#8e8e8e] mt-1">Honey Ranjan · Satyam Pandey · Siddhant Singh · Suryansh · Nikhil Singh</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
