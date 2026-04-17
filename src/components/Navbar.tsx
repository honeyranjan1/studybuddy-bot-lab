import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen, LayoutDashboard, MessageSquare, Menu, X, ClipboardList,
  FileText, Layers, Briefcase, Users, Calendar,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import UserDropdown from "./UserDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainLinks = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const toolLinks = [
  { to: "/notes", label: "Notes Generator", icon: FileText },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/quiz", label: "Quiz", icon: ClipboardList },
  { to: "/pdf-summary", label: "PDF Summary", icon: FileText },
  { to: "/placement", label: "Placement Mode", icon: Briefcase },
  { to: "/partners", label: "Study Partners", icon: Users },
  { to: "/exam-countdown", label: "Exam Countdown", icon: Calendar },
  { to: "/chat", label: "AI Tutor", icon: MessageSquare },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">StudyBuddy AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {mainLinks.map(link => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}>
                <Button variant="ghost" className={`gap-2 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  <Icon className="w-4 h-4" /> {link.label}
                </Button>
              </Link>
            );
          })}

          {/* Tools dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`gap-2 ${toolLinks.some(l => location.pathname === l.to) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <ClipboardList className="w-4 h-4" /> Tools ▾
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {toolLinks.map(link => {
                const Icon = link.icon;
                return (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" /> {link.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            session ? (
              <UserDropdown />
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Log in</Button></Link>
                <Link to="/signup"><Button variant="hero" size="sm">Get Started</Button></Link>
              </>
            )
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {mainLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Icon className="w-4 h-4" /> {link.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="border-t border-border my-2 pt-2">
                <p className="text-xs text-muted-foreground px-3 mb-1 font-medium">TOOLS</p>
                {toolLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                        <Icon className="w-4 h-4" /> {link.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
              <div className="border-t border-border pt-2 mt-2 flex flex-col gap-2">
                {session ? (
                  <div className="px-2"><UserDropdown /></div>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>
                      <Button variant="hero" className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
