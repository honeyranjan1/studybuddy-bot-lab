import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Layers, ClipboardList, FileSearch, MessageSquare, ArrowRight, Briefcase } from "lucide-react";

const tools = [
  { to: "/notes", title: "Notes Generator", description: "Type a topic — get structured, exam-ready notes in seconds.", icon: FileText, color: "from-indigo-500 to-blue-500" },
  { to: "/flashcards", title: "Flashcards Generator", description: "Auto-generate flashcards for active recall and spaced repetition.", icon: Layers, color: "from-purple-500 to-pink-500" },
  { to: "/quiz", title: "Quiz Generator", description: "Multiple-choice quizzes that adapt to your weak areas.", icon: ClipboardList, color: "from-emerald-500 to-teal-500" },
  { to: "/pdf-summary", title: "PDF Summary Tool", description: "Upload a PDF — get summary, key points, and flashcards.", icon: FileSearch, color: "from-orange-500 to-amber-500" },
  { to: "/chat", title: "Doubt Solver Chatbot", description: "Ask anything — voice, text, or image. Get instant answers.", icon: MessageSquare, color: "from-rose-500 to-red-500" },
  { to: "/placement", title: "Placement Prep", description: "DSA tracker, interview questions, and coding checklists.", icon: Briefcase, color: "from-sky-500 to-blue-600" },
];

const Tools = () => (
  <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">AI Study Tools</h1>
      <p className="text-muted-foreground mt-1">Pick a tool and get started — everything is powered by AI.</p>
    </motion.div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {tools.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <motion.div
            key={tool.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group p-6 border-border hover:border-primary/40 hover:shadow-elevated transition-all duration-300 h-full flex flex-col">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground mb-1.5">{tool.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{tool.description}</p>
              <Link to={tool.to} className="mt-4">
                <Button variant="ghost" size="sm" className="group/btn -ml-2 text-primary hover:text-primary hover:bg-primary/10">
                  Start <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default Tools;
