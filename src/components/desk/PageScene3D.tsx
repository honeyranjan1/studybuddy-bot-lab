import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Torus, Icosahedron, Octahedron } from "@react-three/drei";
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

export default function PageScene3D() {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const pal = PALS[dark ? "dark" : "light"];
  const kind = routeKind(pathname);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
