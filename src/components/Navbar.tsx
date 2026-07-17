import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import UserDropdown from "./UserDropdown";

const navLinks = [
  { to: "/tools", label: "service" },
  { to: "/dashboard", label: "patient resources" },
  { to: "/", label: "about us" },
  { to: "/chat", label: "education center" },
];

const CloverIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="#1a1a1a" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2c2.8 0 5 2.2 5 5 0 1.3-.5 2.5-1.3 3.4C22 10.9 24 13 24 15.5c0 2.5-2 4.6-4.3 5.1.9.9 1.3 2.1 1.3 3.4 0 2.8-2.2 5-5 5s-5-2.2-5-5c0-1.3.5-2.5 1.3-3.4C10 20.1 8 18 8 15.5S10 10.9 12.3 10.4C11.5 9.5 11 8.3 11 7c0-2.8 2.2-5 5-5z" />
    <circle cx="16" cy="15.5" r="2.2" fill="#EDEEF5" />
  </svg>
);

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 py-6 md:py-8 bg-gradient-to-b from-[#f1f1f1]/80 to-transparent backdrop-blur-[2px]">
      <div className="grid grid-cols-12 max-w-7xl mx-auto px-6 items-center">
        {/* Left: Logo */}
        <Link to="/" className="col-span-6 md:col-span-3 flex items-center gap-2">
          <CloverIcon className="w-7 h-7" />
          <span className="font-display font-medium text-xl tracking-tight text-[#1a1a1a] lowercase">studybuddy</span>
        </Link>

        {/* Center: Desktop nav */}
        <div className="hidden md:flex col-span-6 items-center justify-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.to}
              className={`text-sm lowercase tracking-tight transition-colors ${
                location.pathname === link.to ? "text-[#1a1a1a] font-medium" : "text-[#6a6a6a] hover:text-[#1a1a1a]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-4">
          {!loading && session ? (
            <div className="hidden md:block"><UserDropdown /></div>
          ) : (
            <>
              <Link to="/login" className="hidden md:inline text-sm lowercase text-[#1a1a1a] hover:opacity-70 transition">find help</Link>
              <Link
                to={session ? "/dashboard" : "/signup"}
                className="hidden md:inline-flex items-center gap-1.5 bg-[#1a1a1a] text-white text-sm rounded-full px-5 py-2.5 hover:bg-black transition-all hover:shadow-lg"
              >
                get started <span className="text-brand-green">→</span>
              </Link>
            </>
          )}

          {/* Animated hamburger */}
          <button
            aria-label="Menu"
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full border border-[#1a1a1a]/10 bg-white/60 backdrop-blur"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
              className="block w-4 h-px bg-[#1a1a1a]"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }}
              className="block w-4 h-px bg-[#1a1a1a]"
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-4 right-4 mt-3 rounded-3xl bg-white/90 backdrop-blur-xl border border-black/5 shadow-elevated overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-1">
              {navLinks.map(l => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-base lowercase text-[#1a1a1a] py-2 border-b border-black/5 last:border-0"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                {session ? (
                  <UserDropdown />
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-[#6a6a6a]">find help</Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="bg-[#1a1a1a] text-white text-sm rounded-full px-5 py-3 text-center"
                    >
                      get started →
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
