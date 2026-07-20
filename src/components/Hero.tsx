import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { SearchCapsule, Pill, EdgeLabel } from "@/components/ui/pill";

// Futuristic 3D-style classroom / holographic tech loop
const HERO_VIDEO =
  "https://videos.pexels.com/video-files/3129671/3129671-uhd_3840_2160_25fps.mp4";
const HERO_VIDEO_FALLBACK =
  "https://videos.pexels.com/video-files/8471729/8471729-uhd_2560_1440_30fps.mp4";
const HERO_POSTER =
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600";

const Hero = () => {
  const [query, setQuery] = useState("");

  return (
    <section className="relative w-full h-screen min-h-[720px] overflow-hidden bg-bg-base">
      {/* Video background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="w-full h-full object-cover"
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Bottom fade into #EDEEF5 */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-[#EDEEF5]/60 to-[#EDEEF5]" />
        {/* Top fade for nav legibility */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#EDEEF5]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full grid grid-cols-12 max-w-7xl mx-auto px-6 items-end pb-24 md:pb-32">
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display font-medium tracking-tight text-[36px] leading-[1.05] md:text-[68px] lg:text-[92px]"
          >
            <span className="text-[#1a1a1a]">StudyBuddy offers</span>{" "}
            <span className="text-[#8e8e8e]">notes,</span>
            <br />
            <span className="text-[#8e8e8e]">quizzes, and AI tutoring</span>
            <br />
            <span className="text-[#8e8e8e]">to help you</span>{" "}
            <span className="inline-flex items-center justify-center align-middle w-[24px] md:w-[52px] lg:w-[72px] h-[16px] md:h-[36px] lg:h-[48px] border-[2px] border-[#1a1a1a] rounded-full mx-1">
              <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-[#1a1a1a]" />
            </span>{" "}
            <span className="text-[#8e8e8e]">study smarter.</span>
          </motion.h1>

          {/* Search pill */}
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = query.trim()
                ? `/chat?q=${encodeURIComponent(query)}`
                : "/signup";
            }}
            className="mt-8 flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/60 rounded-full pl-6 pr-2 py-2 shadow-soft max-w-xl"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="what do you want to learn today?"
              className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-[#8e8e8e] text-[#1a1a1a] py-2"
            />
            <button
              type="submit"
              aria-label="Start"
              className="w-11 h-11 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-black transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.form>
        </div>
      </div>

      {/* Middle right: language pill */}
      <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20">
        <button className="glass rounded-full px-4 py-2 text-xs text-[#1a1a1a] tracking-wide">
          pl <span className="mx-1 text-[#8e8e8e]">—</span> <span className="font-medium">en</span>
        </button>
      </div>

      {/* Bottom left */}
      <div className="absolute bottom-6 left-6 z-20 text-xs text-[#1a1a1a]/70 tracking-wide">2026</div>
      {/* Bottom right */}
      <div className="absolute bottom-6 right-6 z-20 text-xs text-[#1a1a1a]/70 tracking-wide lowercase">
        <Link to="/tools" className="hover:text-[#1a1a1a] transition">study tools →</Link>
      </div>
    </section>
  );
};

export default Hero;
