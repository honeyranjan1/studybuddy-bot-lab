import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, RoundedBox, Torus, Icosahedron, Octahedron } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

const ACCENT = "#e5484d";
type Pal = { main: string; soft: string; ambient: number };
const PALS: Record<"dark" | "light", Pal> = {
  dark: { main: "#2a2a2f", soft: "#ede8dd", ambient: 0.4 },
  light: { main: "#ffffff", soft: "#b98a5f", ambient: 0.9 },
};

type Kind = "dashboard" | "chat" | "notes" | "cards" | "quiz" | "pdf" | "placement" | "partners" | "code" | "calendar" | "interview" | "default";

const routeKind = (p: string): Kind => {
  if (p.startsWith("/dashboard")) return "dashboard";
  if (p.startsWith("/chat")) return "chat";
  if (p.startsWith("/notes")) return "notes";
  if (p.startsWith("/flashcards")) return "cards";
  if (p.startsWith("/quiz")) return "quiz";
  if (p.startsWith("/pdf")) return "pdf";
  if (p.startsWith("/dsa")) return "code";
  if (p.startsWith("/mock")) return "interview";
  if (p.startsWith("/placement")) return "placement";
  if (p.startsWith("/partners")) return "partners";
  if (p.startsWith("/exam")) return "calendar";
  return "default";
};

const Mat = ({ c, r = 0.45, m = 0.1 }: { c: string; r?: number; m?: number }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} />
);

function Hero({ kind, pal }: { kind: Kind; pal: Pal }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s, d) => {
    if (!g.current) return;
    const dt = Math.min(d, 0.05);
    g.current.rotation.y += dt * 0.25;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, s.pointer.y * 0.25, 3, dt);
  });
  const { main, soft } = pal;
  let body: JSX.Element;
  switch (kind) {
    case "dashboard":
      body = (<group>{[0.8, 1.4, 1.1, 2, 1.6].map((h, i) => (
        <RoundedBox key={i} args={[0.4, h, 0.4]} radius={0.06} position={[(i - 2) * 0.55, h / 2 - 0.8, 0]}><Mat c={i === 3 ? ACCENT : main} /></RoundedBox>))}</group>);
      break;
    case "chat": case "partners":
      body = (<group>
        <RoundedBox args={[1.8, 1, 0.3]} radius={0.3} position={[-0.3, 0.4, 0]}><Mat c={main} /></RoundedBox>
        <RoundedBox args={[1.4, 0.8, 0.3]} radius={0.28} position={[0.5, -0.6, 0.3]}><Mat c={ACCENT} /></RoundedBox>
        {[-0.4, 0, 0.4].map((x) => <mesh key={x} position={[x - 0.3, 0.4, 0.18]}><sphereGeometry args={[0.09, 16, 16]} /><Mat c={soft} /></mesh>)}
      </group>);
      break;
    case "notes": case "pdf":
      body = (<group rotation={[0.3, 0, 0]}>{[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[1.5, 2, 0.06]} radius={0.03} position={[i * 0.12, i * 0.08, -i * 0.15]} rotation={[0, 0, i * 0.08]}><Mat c={i === 0 ? (kind === "pdf" ? ACCENT : soft) : main} /></RoundedBox>))}</group>);
      break;
    case "cards":
      body = (<group>{[0, 1, 2, 3].map((i) => (
        <RoundedBox key={i} args={[1.2, 1.7, 0.05]} radius={0.08} position={[0, 0, 0]} rotation={[0, (i * Math.PI) / 4, 0]}><Mat c={i === 0 ? ACCENT : main} /></RoundedBox>))}</group>);
      break;
    case "quiz":
      body = (<group><Octahedron args={[1.1]}><Mat c={main} m={0.3} /></Octahedron><Torus args={[1.6, 0.05, 16, 64]} rotation={[Math.PI / 2.3, 0, 0]}><Mat c={ACCENT} /></Torus></group>);
      break;
    case "code":
      body = (<group>
        <RoundedBox args={[2.4, 1.5, 0.1]} radius={0.06} position={[0, 0.5, 0]}><Mat c="#111114" /></RoundedBox>
        {[0.8, 0.55, 0.3, 0.05].map((y, i) => <mesh key={y} position={[-0.9 + i * 0.15 + 0.5, y, 0.06]}><boxGeometry args={[1 - i * 0.15, 0.08, 0.01]} /><Mat c={i === 1 ? ACCENT : "#7ee787"} /></mesh>)}
        <RoundedBox args={[2.4, 0.08, 1.4]} radius={0.03} position={[0, -0.3, 0.6]}><Mat c={main} /></RoundedBox>
      </group>);
      break;
    case "calendar":
      body = (<group><RoundedBox args={[1.8, 2, 0.2]} radius={0.08}><Mat c={soft} /></RoundedBox>
        <RoundedBox args={[1.8, 0.5, 0.22]} radius={0.08} position={[0, 0.8, 0.01]}><Mat c={ACCENT} /></RoundedBox></group>);
      break;
    case "interview": case "placement":
      body = (<group><Icosahedron args={[1, 1]}><meshStandardMaterial color={main} flatShading roughness={0.3} /></Icosahedron>
        <Torus args={[1.5, 0.06, 16, 64]} rotation={[Math.PI / 2, 0, 0]}><Mat c={ACCENT} /></Torus></group>);
      break;
    default:
      body = (<Icosahedron args={[1.1, 0]}><meshStandardMaterial color={ACCENT} flatShading /></Icosahedron>);
  }
  return <group ref={g}>{body}</group>;
}

function Particles({ color }: { color: string }) {
  const pts = useMemo(() => {
    const a = new Float32Array(180 * 3);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() - 0.5) * 14;
    return a;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += Math.min(d, 0.05) * 0.02; });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={180} array={pts} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.6} />
    </points>
  );
}

export function MiniScene3D({ kind }: { kind: Kind }) {
  const pal = PALS.dark;
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.4, 5.5], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#f3e6c8" />
      <pointLight position={[-3, -1, 2]} intensity={14} color={ACCENT} />
      <Float speed={1.3} floatIntensity={0.6} rotationIntensity={0.2}>
        <Hero kind={kind} pal={pal} />
      </Float>
      <Particles color="#d9c38a" />
    </Canvas>
  );
}

type ChatSceneMessage = { id: string; role: "user" | "assistant"; content: string };

function ChatBubble({ message, index, total, pal }: { message: ChatSceneMessage; index: number; total: number; pal: Pal }) {
  const ref = useRef<THREE.Group>(null);
  const isUser = message.role === "user";
  const y = (total - 1) * 0.55 - index * 1.1;
  const x = isUser ? 0.72 : -0.72;
  const width = isUser ? 2.65 : 3.05;

  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.05;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 4, Math.min(delta, 0.05));
  });

  return (
    <group ref={ref} position={[x, y, index * -0.12]}>
      <RoundedBox args={[width, 0.82, 0.16]} radius={0.18} smoothness={4}>
        <meshStandardMaterial color={isUser ? ACCENT : pal.main} roughness={0.3} metalness={0.12} />
      </RoundedBox>
      <Html transform position={[0, 0, 0.1]} distanceFactor={5.5} center>
        <div className={`w-[220px] select-none px-4 py-3 ${isUser ? "text-primary-foreground" : "text-foreground"}`}>
          <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.16em] opacity-60">{isUser ? "You" : "StudyBuddy"}</p>
          <p className="line-clamp-2 text-[11px] leading-4">{message.content || "Thinking…"}</p>
        </div>
      </Html>
    </group>
  );
}

export function ChatThread3D({ messages, isTyping = false }: { messages: ChatSceneMessage[]; isTyping?: boolean }) {
  const { theme } = useTheme();
  const pal = PALS[theme === "dark" ? "dark" : "light"];
  const visible = messages.filter((message) => message.id !== "welcome").slice(-4);
  const sceneMessages = isTyping && visible[visible.length - 1]?.role !== "assistant"
    ? [...visible, { id: "thinking", role: "assistant" as const, content: "Thinking through your question…" }]
    : visible;

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/40 backdrop-blur-2xl">
      <div className="pointer-events-none absolute left-5 top-5 z-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Live 3D thread</p>
        <p className="mt-1 text-sm text-foreground">Questions and answers in motion</p>
      </div>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 43 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={pal.ambient + 0.25} />
        <directionalLight position={[4, 5, 5]} intensity={1.5} />
        <pointLight position={[-3, -2, 3]} intensity={10} color={ACCENT} />
        <group position={[0, -0.15, 0]} scale={sceneMessages.length > 3 ? 0.82 : 1}>
          {sceneMessages.length ? sceneMessages.map((message, index) => (
            <ChatBubble key={message.id} message={message} index={index} total={sceneMessages.length} pal={pal} />
          )) : (
            <Float speed={1.2} floatIntensity={0.5} rotationIntensity={0.15}>
              <Hero kind="chat" pal={pal} />
            </Float>
          )}
        </group>
        <Particles color={theme === "dark" ? "#ffffff" : "#555555"} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-5 bottom-4 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{sceneMessages.length ? `${sceneMessages.length} recent messages` : "Ask your first question"}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive" /> live</span>
      </div>
    </div>
  );
}

export default function PageScene3D() {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const pal = PALS[dark ? "dark" : "light"];
  const kind = routeKind(pathname);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (kind === "dashboard" || kind === "chat") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-70 md:opacity-90">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={pal.ambient} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <pointLight position={[-4, -2, 3]} intensity={12} color={ACCENT} />
        <Suspense fallback={null}>
          <Float speed={reduced ? 0 : 1.4} rotationIntensity={0.3} floatIntensity={reduced ? 0 : 0.8}>
            <group position={[2.8, 0.2, -1]} scale={0.95}>
              <Hero key={kind} kind={kind} pal={pal} />
            </group>
          </Float>
          <Float speed={reduced ? 0 : 1} floatIntensity={1.2}>
            <mesh position={[-3.6, -1.8, -2]}><torusKnotGeometry args={[0.35, 0.12, 80, 12]} /><Mat c={ACCENT} m={0.4} /></mesh>
            <mesh position={[-2.8, 2, -3]}><sphereGeometry args={[0.3, 24, 24]} /><Mat c={pal.soft} /></mesh>
          </Float>
          <Particles color={dark ? "#ffffff" : "#555"} />
        </Suspense>
      </Canvas>
    </div>
  );
}
