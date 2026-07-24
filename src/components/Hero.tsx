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
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={HERO_VIDEO} type="video/mp4" />
          <source src={HERO_VIDEO_FALLBACK} type="video/mp4" />
        </video>
        {/* Scrim for text legibility */}
        <div className="absolute inset-0 bg-[#EDEEF5]/55" />
        {/* Bottom fade into #EDEEF5 */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-[#EDEEF5]/80 to-[#EDEEF5]" />
        {/* Top fade for nav legibility */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#EDEEF5]/80 to-transparent" />
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

          {/* Search pill (reusable) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8"
          >
            <SearchCapsule
              value={query}
              onValueChange={setQuery}
              placeholder="what do you want to learn today?"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = query.trim()
                  ? `/chat?q=${encodeURIComponent(query)}`
                  : "/signup";
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Middle right: language pill */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20"
      >
        <Pill variant="glass" className="px-4 py-2 text-xs">
          pl <span className="mx-1 text-[#8e8e8e]">—</span> <span className="font-medium">en</span>
        </Pill>
      </motion.div>

      {/* Bottom left */}
      <div className="absolute bottom-6 left-6 z-20"><EdgeLabel>2026</EdgeLabel></div>
      {/* Bottom right */}
      <div className="absolute bottom-6 right-6 z-20">
        <Link to="/tools" className="text-xs text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition lowercase tracking-wide">study tools →</Link>
      </div>
    </section>
  );
};

export default Hero;
