import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { SearchCapsule, Pill, EdgeLabel } from "@/components/ui/pill";

const HERO_VIDEO =
  "https://videos.pexels.com/video-files/3129671/3129671-uhd_3840_2160_25fps.mp4";
const HERO_VIDEO_FALLBACK =
  "https://videos.pexels.com/video-files/8471729/8471729-uhd_2560_1440_30fps.mp4";
const HERO_POSTER =
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600";

const chapters = [
  { n: "01", t: "measure", d: "capture signals from sleep, focus, and study hours." },
  { n: "02", t: "understand", d: "ai correlates habits with real learning outcomes." },
  { n: "03", t: "act", d: "small daily nudges that build compounding progress." },
];

const Measured = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-bg-base selection:bg-brand-green selection:text-black">
      <Navbar />

      {/* Hero — mėntality style */}
      <section className="relative w-full h-screen min-h-[720px] overflow-hidden bg-bg-base">
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
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-[#EDEEF5]/60 to-[#EDEEF5]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#EDEEF5]/60 to-transparent" />
        </div>

        <div className="relative z-10 h-full grid grid-cols-12 max-w-7xl mx-auto px-6 items-end pb-24 md:pb-32">
          <div className="col-span-12 md:col-span-10 md:col-start-2">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display font-medium tracking-tight text-[36px] leading-[1.05] md:text-[68px] lg:text-[92px]"
            >
              <span className="text-[#1a1a1a]">measured</span>{" "}
              <span className="text-[#8e8e8e]">turns study data</span>
              <br />
              <span className="text-[#8e8e8e]">into daily clarity</span>{" "}
              <br />
              <span className="text-[#8e8e8e]">for engineering minds.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-8"
            >
              <SearchCapsule
                value={query}
                onValueChange={setQuery}
                placeholder="what do you want to measure?"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = query.trim()
                    ? `/chat?q=${encodeURIComponent(query)}`
                    : "/dashboard";
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Edge anchors */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20"
        >
          <Pill variant="glass" className="px-4 py-2 text-xs">
            v1 <span className="mx-1 text-[#8e8e8e]">—</span> <span className="font-medium">beta</span>
          </Pill>
        </motion.div>

        <div className="absolute bottom-6 left-6 z-20"><EdgeLabel>2026</EdgeLabel></div>
        <div className="absolute bottom-6 right-6 z-20">
          <Link to="/dashboard" className="text-xs text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition lowercase tracking-wide">open dashboard →</Link>
        </div>
      </section>

      {/* Chapters */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-xs lowercase text-[#1a1a1a]/60 mb-3">how measured works</p>
            <h2 className="font-display text-4xl md:text-5xl text-[#1a1a1a] lowercase tracking-tight">three chapters. one habit.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {chapters.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-t border-[#1a1a1a] pt-6"
              >
                <p className="text-xs text-[#1a1a1a]/60 mb-8">{c.n}</p>
                <h3 className="font-display text-2xl text-[#1a1a1a] mb-2 lowercase">{c.t}</h3>
                <p className="text-sm text-[#6a6a6a]">{c.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA glass card */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden glass">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-green/20 blur-3xl" />
          <div className="relative z-10 grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 md:col-span-8">
              <h2 className="font-display text-4xl md:text-6xl text-[#1a1a1a] lowercase tracking-tight leading-[1.05]">
                start measuring
                <br />
                <span className="text-[#8e8e8e]">what actually matters.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-4 flex md:justify-end gap-3 flex-wrap">
              <Pill variant="solid" onClick={() => (window.location.href = "/signup")}>get started →</Pill>
              <Pill variant="outline" onClick={() => (window.location.href = "/tools")}>explore tools</Pill>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Measured;
