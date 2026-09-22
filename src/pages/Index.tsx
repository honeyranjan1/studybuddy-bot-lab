import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import DeskExperience from "@/components/desk/DeskExperience";
import { DESK_ITEMS } from "@/components/desk/deskItems";
import { useTheme } from "@/hooks/useTheme";

const navLinks = [
  { to: "/tools", label: "tools" },
  { to: "/chat", label: "ai tutor" },
  { to: "/placement", label: "placement" },
  { to: "/partners", label: "partners" },
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  const t = {
    page: dark ? "bg-[#0d0d0f] text-white" : "bg-[#eceae4] text-[#111113]",
    dim: dark ? "text-white/55" : "text-black/50",
    faint: dark ? "text-white/40" : "text-black/40",
    strong: dark ? "hover:text-white" : "hover:text-black",
    soft: dark ? "text-white/45" : "text-black/45",
    border: dark ? "border-white/20" : "border-black/20",
    invert: dark ? "hover:bg-white hover:text-black" : "hover:bg-black hover:text-white",
    cta: dark ? "bg-white text-black hover:bg-white/85" : "bg-[#111113] text-white hover:bg-black/85",
    strip: dark ? "border-white/10 bg-black/30" : "border-black/10 bg-white/40",
  };

  return (
    <div className={`relative h-screen w-full overflow-hidden ${t.page}`}>
      <DeskExperience />

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="pointer-events-auto flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-[3px] bg-[#e5484d]" />
          <span className="font-display text-sm font-medium uppercase tracking-[0.2em]">StudyBuddy</span>
        </Link>

        <nav className="pointer-events-auto hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-[11px] uppercase tracking-[0.22em] transition ${t.dim} ${t.strong}`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${t.border} ${t.invert}`}
          >
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            to="/login"
            className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] transition ${t.border} ${t.invert}`}
          >
            sign in
          </Link>
        </nav>

        <div className="pointer-events-auto flex items-center gap-3 md:hidden">
          <button onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Headline */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-20 px-5 md:top-28 md:px-8">
        <p className={`text-[10px] uppercase tracking-[0.32em] ${t.faint}`}>your digital study desk</p>
        <h1 className="mt-3 max-w-3xl font-display text-[11vw] font-medium leading-[0.92] tracking-tight md:text-[64px]">
          study smarter,
          <br />
          <span className={dark ? "text-white/45" : "text-black/40"}>one desk, every tool.</span>
        </h1>
        <p className={`mt-4 max-w-sm text-sm ${dark ? "text-white/50" : "text-black/50"}`}>
          Hover any object on the desk — notes, flashcards, quizzes, PDF summaries, your AI tutor, coding practice, mock
          interviews, study partners and exam countdowns.
        </p>
        <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className={`rounded-full px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] transition ${t.cta}`}
          >
            get started free
          </Link>
          <Link
            to="/tools"
            className={`rounded-full border px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition ${t.border} ${t.dim} ${t.strong}`}
          >
            browse tools
          </Link>
        </div>
      </div>

      {/* Bottom strip — accessible text links to every desk object */}
      <footer
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden items-center justify-between gap-4 border-t px-8 py-3 backdrop-blur-md md:flex ${t.strip}`}
      >
        <div className="pointer-events-auto flex flex-wrap items-center gap-5">
          {DESK_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`text-[10px] uppercase tracking-[0.22em] transition hover:text-[#e5484d] ${t.soft}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <span className={`text-[10px] uppercase tracking-[0.22em] ${dark ? "text-white/30" : "text-black/30"}`}>
          2026 — studybuddy ai
        </span>
      </footer>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className={`fixed inset-0 z-50 flex flex-col px-6 py-5 md:hidden ${
            dark ? "bg-black text-white" : "bg-[#eceae4] text-[#111113]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-sm uppercase tracking-[0.2em]">StudyBuddy</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-4 overflow-y-auto">
            {[...navLinks, ...DESK_ITEMS.map((i) => ({ to: i.to, label: i.label.toLowerCase() }))].map((l) => (
              <Link
                key={l.to + l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`font-display text-3xl lowercase tracking-tight ${dark ? "text-white/80" : "text-black/80"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-auto rounded-full bg-[#e5484d] py-3 text-center text-xs uppercase tracking-[0.2em] text-white"
          >
            sign in
          </Link>
        </div>
      )}
    </div>
  );
};

export default Index;
