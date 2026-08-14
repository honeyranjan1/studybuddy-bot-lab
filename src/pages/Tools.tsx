import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Layers, ClipboardList, FileSearch, MessageSquare, ArrowUpRight, Briefcase, Sparkles } from "lucide-react";

const tools = [
  { to: "/notes", title: "Notes Generator", description: "Type a topic — get structured, exam-ready notes in seconds.", icon: FileText, tag: "write", span: "lg:col-span-3" },
  { to: "/flashcards", title: "Flashcards", description: "Auto-generate cards for active recall and spaced repetition.", icon: Layers, tag: "recall", span: "lg:col-span-3" },
  { to: "/quiz", title: "Quiz Generator", description: "Adaptive multiple-choice quizzes that target your weak areas.", icon: ClipboardList, tag: "test", span: "lg:col-span-2" },
  { to: "/pdf-summary", title: "PDF Summary", description: "Upload a PDF — get a summary, key points and flashcards.", icon: FileSearch, tag: "digest", span: "lg:col-span-2" },
  { to: "/chat", title: "Doubt Solver", description: "Ask anything — voice, text or image. Instant answers.", icon: MessageSquare, tag: "tutor", span: "lg:col-span-2" },
  { to: "/placement", title: "Placement Prep", description: "DSA tracker, interview questions and coding checklists.", icon: Briefcase, tag: "career", span: "lg:col-span-6" },
];

const Tools = () => (
  <div className="container mx-auto max-w-6xl px-4 md:px-6 py-10">
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10 md:mb-14"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="w-3 h-3 text-accent" /> ai toolkit
      </div>
      <h1 className="mt-5 font-display font-semibold tracking-tight text-foreground text-[13vw] leading-[0.85] sm:text-6xl md:text-7xl lowercase">
        study tools
      </h1>
      <p className="mt-4 max-w-md text-sm md:text-base text-muted-foreground leading-relaxed">
        Six focused tools. Pick one and start — everything runs on AI.
      </p>
    </motion.header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {tools.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <motion.div
            key={tool.to}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.45 }}
            className={tool.span}
          >
            <Link
              to={tool.to}
              className="group relative flex h-full min-h-[190px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-border bg-card/70 backdrop-blur-xl p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-elevated"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{tool.tag}</span>
              </div>

              <div className="relative">
                <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-foreground lowercase">
                  {tool.title}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-sm">{tool.description}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  start
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default Tools;
