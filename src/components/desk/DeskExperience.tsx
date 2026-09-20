import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import StudyDeskScene from "./StudyDeskScene";
import { DESK_ITEMS, type DeskItem } from "./deskItems";

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
        camera={{ position: [0, 3.05, 5.9], fov: 48 }}
        onPointerMissed={() => setFocus(null)}
      >
        <Suspense fallback={null}>
          <StudyDeskScene
            hovered={focus ?? hovered}
            onHover={setHovered}
            onSelect={select}
            focus={focus}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>

      {/* Focus card */}
      <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 md:bottom-16 md:left-8 md:translate-x-0">
        {active && (
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-black/55 p-5 backdrop-blur-xl animate-fade-in">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">study desk</p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-white">{active.label}</h2>
            <p className="mt-1 text-sm text-white/60">{active.caption}</p>
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
