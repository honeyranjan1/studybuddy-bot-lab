import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import DeskExperience from "@/components/desk/DeskExperience";
import { DESK_ITEMS } from "@/components/desk/deskItems";

const navLinks = [
  { to: "/tools", label: "tools" },
  { to: "/chat", label: "ai tutor" },
  { to: "/placement", label: "placement" },
  { to: "/partners", label: "partners" },
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0d0d0f] text-white">
      <DeskExperience />

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="pointer-events-auto flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-[3px] bg-[#e5484d]" />
          <span className="font-display text-sm font-medium tracking-[0.2em] uppercase">StudyBuddy</span>
        </Link>

        <nav className="pointer-events-auto hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[11px] uppercase tracking-[0.22em] text-white/55 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black"
          >
            sign in
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="pointer-events-auto md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Headline */}
      <div className="pointer-events-none absolute inset-x-0 top-24 z-20 px-5 md:top-28 md:px-8">
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">your digital study desk</p>
        <h1 className="mt-3 max-w-3xl font-display text-[11vw] font-medium leading-[0.92] tracking-tight md:text-[64px]">
          study smarter,
          <br />
          <span className="text-white/45">one desk, six tools.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm text-white/50">
          Move your cursor around the desk and pick up a tool. Notes, flashcards, quizzes, an AI tutor, coding practice
          and exam countdowns — all in one place.
        </p>
        <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className="rounded-full bg-white px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition hover:bg-white/85"
          >
            get started free
          </Link>
          <Link
            to="/tools"
            className="rounded-full border border-white/20 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
          >
            browse tools
          </Link>
        </div>
      </div>

      {/* Bottom strip — accessible text links to every desk object */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden items-center justify-between gap-4 border-t border-white/10 bg-black/30 px-8 py-3 backdrop-blur-md md:flex">
        <div className="pointer-events-auto flex flex-wrap items-center gap-5">
          {DESK_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="text-[10px] uppercase tracking-[0.22em] text-white/45 transition hover:text-[#e5484d]"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/30">2026 — studybuddy ai</span>
      </footer>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black px-6 py-5 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm uppercase tracking-[0.2em]">StudyBuddy</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-12 flex flex-col gap-5">
            {[...navLinks, ...DESK_ITEMS.map((i) => ({ to: i.to, label: i.label.toLowerCase() }))].map((l) => (
              <Link
                key={l.to + l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="font-display text-3xl lowercase tracking-tight text-white/80"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-auto rounded-full bg-[#e5484d] py-3 text-center text-xs uppercase tracking-[0.2em]"
          >
            sign in
          </Link>
        </div>
      )}
    </div>
  );
};

export default Index;
