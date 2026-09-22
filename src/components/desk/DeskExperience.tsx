import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import StudyDeskScene, { DESK_THEMES } from "./StudyDeskScene";
import { DESK_ITEMS, type DeskItem } from "./deskItems";
import { useTheme } from "@/hooks/useTheme";

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
};

const DeskExperience = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const deskTheme = isDark ? DESK_THEMES.dark : DESK_THEMES.light;
  const [hovered, setHovered] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2));
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const select = (item: DeskItem) => {
    if (focus === item.id) {
      navigate(item.to);
      return;
    }
    setFocus(item.id);
  };

  const active = DESK_ITEMS.find((i) => i.id === (focus ?? hovered));

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 3.15, 6.3], fov: 48 }}
        onPointerMissed={() => setFocus(null)}
      >
        <Suspense fallback={null}>
          <StudyDeskScene
            hovered={focus ?? hovered}
            onHover={setHovered}
            onSelect={select}
            focus={focus}
            reducedMotion={reducedMotion}
            theme={deskTheme}
          />
        </Suspense>
      </Canvas>

      {/* Focus card */}
      <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 md:bottom-16 md:left-8 md:translate-x-0">
        {active && (
          <div
            className={`pointer-events-auto rounded-2xl border p-5 backdrop-blur-xl animate-fade-in ${
              isDark ? "border-white/15 bg-black/55" : "border-black/10 bg-white/70"
            }`}
          >
            <p className={`text-[10px] uppercase tracking-[0.3em] ${isDark ? "text-white/50" : "text-black/45"}`}>
              study desk
            </p>
            <h2
              className={`mt-2 font-display text-2xl font-medium tracking-tight ${
                isDark ? "text-white" : "text-[#111113]"
              }`}
            >
              {active.label}
            </h2>
            <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-black/55"}`}>{active.caption}</p>
            <button
              onClick={() => navigate(active.to)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e5484d] px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:brightness-110"
            >
              open {active.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeskExperience;
