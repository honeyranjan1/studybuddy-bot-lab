import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { DESK_ITEMS, type DeskItem } from "./deskItems";

const ACCENT = "#e5484d";

export type DeskTheme = {
  bg: string;
  fog: string;
  wall: string;
  floor: string;
  wood: string;
  woodLeg: string;
  paper: string;
  shell: string;
  label: string;
  labelActive: string;
  labelOutline: string;
  ambient: number;
  dirIntensity: number;
};

export const DESK_THEMES: Record<"dark" | "light", DeskTheme> = {
  dark: {
    bg: "#0d0d0f",
    fog: "#0d0d0f",
    wall: "#1a1a1d",
    floor: "#141416",
    wood: "#6b4b34",
    woodLeg: "#4c3626",
    paper: "#ede8dd",
    shell: "#1b1b1d",
    label: "#8b8b90",
    labelActive: "#ffffff",
    labelOutline: "#000000",
    ambient: 0.35,
    dirIntensity: 1.1,
  },
  light: {
    bg: "#eceae4",
    fog: "#eceae4",
    wall: "#e2ded5",
    floor: "#d5d0c6",
    wood: "#b98a5f",
    woodLeg: "#9b7047",
    paper: "#ffffff",
    shell: "#4a4a50",
    label: "#5c5c63",
    labelActive: "#111113",
    labelOutline: "#ffffff",
    ambient: 0.85,
    dirIntensity: 1.5,
  },
};

type Props = {
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (item: DeskItem) => void;
  focus: string | null;
  reducedMotion: boolean;
  theme: DeskTheme;
};

function Hotspot({
  item,
  hovered,
  onHover,
  onSelect,
  theme,
  children,
}: {
  item: DeskItem;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (item: DeskItem) => void;
  theme: DeskTheme;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const isActive = hovered === item.id;

  useFrame((_, delta) => {
    if (!group.current) return;
    const dt = Math.min(delta, 0.05);
    const target = isActive ? 1 : 0;
    const g = group.current;
    g.userData.t = THREE.MathUtils.damp(g.userData.t ?? 0, target, 8, dt);
    const t = g.userData.t as number;
    g.position.y = item.position[1] + t * 0.09;
    g.scale.setScalar(1 + t * 0.06);
  });

  return (
    <group
      ref={group}
      position={item.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(item.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      {children}
      <Text
        position={item.labelOffset ?? [0, 0.34, 0]}
        fontSize={0.085}
        color={isActive ? theme.labelActive : theme.label}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor={theme.labelOutline}
      >
        {item.label.toUpperCase()}
      </Text>
    </group>
  );
}

function Notebook({ theme }: { theme: DeskTheme }) {
  return (
    <group rotation={[0, 0.35, 0]}>
      <RoundedBox args={[0.62, 0.05, 0.44]} radius={0.015} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={ACCENT} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.58, 0.04, 0.4]} radius={0.01} position={[0, 0.045, 0]} castShadow>
        <meshStandardMaterial color={theme.paper} roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

function Flashcards({ theme }: { theme: DeskTheme }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <RoundedBox
          key={i}
          args={[0.34, 0.015, 0.24]}
          radius={0.01}
          smoothness={3}
          position={[i * 0.035, i * 0.02, -i * 0.03]}
          rotation={[0, -0.18 * i + 0.2, 0]}
          castShadow
        >
          <meshStandardMaterial color={i === 2 ? "#ffffff" : theme.paper} roughness={0.9} />
        </RoundedBox>
      ))}
    </group>
  );
}

function QuizSheet() {
  return (
    <group rotation={[0, -0.25, 0]}>
      <RoundedBox args={[0.42, 0.012, 0.56]} radius={0.006} smoothness={3} castShadow>
        <meshStandardMaterial color="#f6f4ef" roughness={0.95} />
      </RoundedBox>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.05, 0.012, -0.16 + i * 0.11]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.24, 0.016]} />
          <meshBasicMaterial color="#b9b5ab" />
        </mesh>
      ))}
      <mesh position={[0.14, 0.014, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.03, 24]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
    </group>
  );
}

function Screen({ width, height, tint }: { width: number; height: number; tint: string }) {
  return (
    <mesh position={[0, 0, 0.026]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={0.7} roughness={0.4} />
    </mesh>
  );
}

function Monitor({ theme }: { theme: DeskTheme }) {
  return (
    <group>
      <RoundedBox args={[1.5, 0.88, 0.05]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color={theme.shell} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <Screen width={1.4} height={0.78} tint="#2d4a63" />
      <mesh position={[0, -0.58, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.28, 16]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.72, 0.02]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.035, 24]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Second, smaller monitor showing a document summary preview. */
function PdfMonitor({ theme, active }: { theme: DeskTheme; active: boolean }) {
  return (
    <group rotation={[0, 0.5, 0]}>
      <RoundedBox args={[1.0, 0.68, 0.045]} radius={0.025} smoothness={3} castShadow>
        <meshStandardMaterial color={theme.shell} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <Screen width={0.92} height={0.6} tint="#20323f" />
      <group position={[0, 0, 0.03]}>
        <Text position={[-0.36, 0.2, 0]} fontSize={0.05} color="#ffffff" anchorX="left" anchorY="middle">
          {active ? "SUMMARY" : "PDF.pdf"}
        </Text>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.06, 0.07 - i * 0.075, 0]}>
            <planeGeometry args={[active ? 0.68 - i * 0.05 : 0.3, 0.022]} />
            <meshBasicMaterial color={active ? "#d7e4ec" : "#4d6675"} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.45, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.22, 14]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.56, 0.02]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.03, 20]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Laptop({ tint, children }: { tint: string; children?: React.ReactNode }) {
  return (
    <group>
      <RoundedBox args={[0.72, 0.03, 0.5]} radius={0.012} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#45464b" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      <group position={[0, 0.02, -0.25]} rotation={[-1.15, 0, 0]}>
        <RoundedBox args={[0.72, 0.46, 0.022]} radius={0.012} smoothness={3} position={[0, 0.23, 0]} castShadow>
          <meshStandardMaterial color="#45464b" metalness={0.5} roughness={0.4} />
        </RoundedBox>
        <group position={[0, 0.23, 0]}>
          <Screen width={0.66} height={0.4} tint={tint} />
          <group position={[0, 0, 0.03]}>{children}</group>
        </group>
      </group>
    </group>
  );
}

function DsaLaptop() {
  return (
    <group rotation={[0, -0.5, 0]}>
      <Laptop tint="#1d3b2a">
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.12 + (i % 2) * 0.04, 0.12 - i * 0.06, 0]}>
            <planeGeometry args={[0.3 - i * 0.04, 0.018]} />
            <meshBasicMaterial color="#6fd39b" />
          </mesh>
        ))}
      </Laptop>
    </group>
  );
}

/** Interview laptop: start button + live rubric bars on the screen. */
function InterviewLaptop({ active }: { active: boolean }) {
  const bars = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!bars.current) return;
    const t = clock.elapsedTime;
    bars.current.children.forEach((child, i) => {
      const v = active ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.2 + i)) : 0.35;
      child.scale.x = v;
      child.position.x = -0.22 + (v * 0.34) / 2;
    });
  });

  return (
    <group rotation={[0, -0.62, 0]}>
      <Laptop tint="#2a1f3d">
        <Text position={[0, 0.14, 0]} fontSize={0.045} color="#ffffff" anchorX="center" anchorY="middle">
          AI MOCK INTERVIEW
        </Text>
        <mesh position={[0, 0.055, 0]}>
          <planeGeometry args={[0.3, 0.06]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
        <Text position={[0, 0.055, 0.002]} fontSize={0.028} color="#ffffff" anchorX="center" anchorY="middle">
          START
        </Text>
        <group ref={bars}>
          {["clarity", "correctness", "depth", "communication"].map((k, i) => (
            <mesh key={k} position={[-0.22, -0.03 - i * 0.04, 0]}>
              <planeGeometry args={[0.34, 0.016]} />
              <meshBasicMaterial color="#b795ff" />
            </mesh>
          ))}
        </group>
        {["CLA", "COR", "DEP", "COM"].map((k, i) => (
          <Text
            key={k}
            position={[-0.28, -0.03 - i * 0.04, 0]}
            fontSize={0.018}
            color="#cfc3e8"
            anchorX="right"
            anchorY="middle"
          >
            {k}
          </Text>
        ))}
      </Laptop>
    </group>
  );
}

/** Study Partners: a phone propped on the desk showing a chat thread. */
function PartnerPhone({ active }: { active: boolean }) {
  return (
    <group rotation={[0, 0.35, 0]}>
      <RoundedBox args={[0.24, 0.46, 0.022]} radius={0.02} smoothness={4} rotation={[-0.5, 0, 0]} position={[0, 0.17, 0]} castShadow>
        <meshStandardMaterial color="#232327" roughness={0.45} metalness={0.3} />
      </RoundedBox>
      <group rotation={[-0.5, 0, 0]} position={[0, 0.17, 0]}>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[0.21, 0.42]} />
          <meshStandardMaterial color="#14202b" emissive="#14202b" emissiveIntensity={0.6} />
        </mesh>
        <group position={[0, 0, 0.016]}>
          {[0, 1, 2, 3].map((i) => {
            const mine = i % 2 === 1;
            return (
              <mesh key={i} position={[mine ? 0.04 : -0.04, 0.13 - i * 0.07, 0]}>
                <planeGeometry args={[0.11, 0.045]} />
                <meshBasicMaterial color={mine ? ACCENT : "#3f5d72"} />
              </mesh>
            );
          })}
          <Text position={[0, -0.17, 0]} fontSize={0.022} color="#9fb6c6" anchorX="center" anchorY="middle">
            {active ? "OPEN CHAT" : "2 MATCHES"}
          </Text>
        </group>
      </group>
      <mesh position={[0, 0.02, -0.07]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.12]} />
        <meshStandardMaterial color="#2a2a2d" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Calendar({ theme }: { theme: DeskTheme }) {
  return (
    <group rotation={[0, -0.15, 0]}>
      <RoundedBox
        args={[0.46, 0.34, 0.03]}
        radius={0.015}
        smoothness={3}
        rotation={[-0.35, 0, 0]}
        position={[0, 0.14, 0]}
        castShadow
      >
        <meshStandardMaterial color={theme.paper} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.27, 0.035]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[0.46, 0.09]} />
        <meshStandardMaterial color={ACCENT} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, -0.06]} castShadow>
        <boxGeometry args={[0.3, 0.04, 0.16]} />
        <meshStandardMaterial color="#2a2a2d" roughness={0.6} />
      </mesh>
    </group>
  );
}

function DeskSurface({ theme }: { theme: DeskTheme }) {
  return (
    <group>
      <RoundedBox args={[5.6, 0.12, 2.4]} radius={0.04} smoothness={3} position={[0, 0.7, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={theme.wood} roughness={0.75} />
      </RoundedBox>
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 0.32, 0]} castShadow>
          <boxGeometry args={[0.14, 0.76, 2.1]} />
          <meshStandardMaterial color={theme.woodLeg} roughness={0.8} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={theme.floor} roughness={0.95} />
      </mesh>
      <mesh position={[0, 3, -3.4]} receiveShadow>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial color={theme.wall} roughness={1} />
      </mesh>
    </group>
  );
}

function Lamp({ dark }: { dark: boolean }) {
  return (
    <group position={[-2.3, 0.76, -0.55]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
        <meshStandardMaterial color="#2c2c30" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.25]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 10]} />
        <meshStandardMaterial color="#2c2c30" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.2, 0.6, 0.12]} rotation={[0.6, 0, 0.5]} castShadow>
        <coneGeometry args={[0.16, 0.22, 20, 1, true]} />
        <meshStandardMaterial color={ACCENT} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <pointLight position={[0.3, 0.55, 0.3]} intensity={dark ? 6 : 2.5} distance={4.5} decay={2} color="#ffd9a8" />
    </group>
  );
}

function Mug({ theme }: { theme: DeskTheme }) {
  return (
    <group position={[2.2, 0.82, 1.0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.16, 20]} />
        <meshStandardMaterial color={theme.paper} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.01, 20]} />
        <meshStandardMaterial color="#4a2e1d" roughness={0.3} />
      </mesh>
    </group>
  );
}

function CameraRig({ focus, reducedMotion }: { focus: string | null; reducedMotion: boolean }) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.95, 0), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const item = DESK_ITEMS.find((i) => i.id === focus);
    if (item) {
      desired.set(item.position[0] * 0.75, item.position[1] + 0.85, item.position[2] + 2.1);
      tmp.set(item.position[0], item.position[1], item.position[2]);
      target.lerp(tmp, 1 - Math.exp(-5 * dt));
    } else {
      const px = reducedMotion ? 0 : pointer.x;
      const py = reducedMotion ? 0 : pointer.y;
      desired.set(px * 1.1, 3.15 + py * 0.35, 6.3);
      tmp.set(px * 0.3, 1.15, 0);
      target.lerp(tmp, 1 - Math.exp(-3 * dt));
    }
    camera.position.lerp(desired, 1 - Math.exp(-4 * dt));
    camera.lookAt(target);
  });

  return null;
}

const StudyDeskScene = ({ hovered, onHover, onSelect, focus, reducedMotion, theme }: Props) => {
  const byId = (id: string) => DESK_ITEMS.find((i) => i.id === id)!;
  const dark = theme.bg === DESK_THEMES.dark.bg;
  const common = { hovered, onHover, onSelect, theme };

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 9, 22]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={theme.dirIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment>
        <Lightformer intensity={dark ? 1.6 : 2.4} position={[0, 5, 2]} scale={[8, 6, 1]} />
        <Lightformer
          intensity={dark ? 0.7 : 1.2}
          color="#9db6c9"
          position={[-6, 2, 0]}
          rotation-y={Math.PI / 2}
          scale={[12, 3, 1]}
        />
      </Environment>

      <DeskSurface theme={theme} />
      <Lamp dark={dark} />
      <Mug theme={theme} />

      <Hotspot item={byId("notes")} {...common}>
        <Notebook theme={theme} />
      </Hotspot>
      <Hotspot item={byId("flashcards")} {...common}>
        <Flashcards theme={theme} />
      </Hotspot>
      <Hotspot item={byId("quiz")} {...common}>
        <QuizSheet />
      </Hotspot>
      <Hotspot item={byId("partners")} {...common}>
        <PartnerPhone active={hovered === "partners"} />
      </Hotspot>
      <Hotspot item={byId("tutor")} {...common}>
        <Monitor theme={theme} />
      </Hotspot>
      <Hotspot item={byId("pdf")} {...common}>
        <PdfMonitor theme={theme} active={hovered === "pdf"} />
      </Hotspot>
      <Hotspot item={byId("dsa")} {...common}>
        <DsaLaptop />
      </Hotspot>
      <Hotspot item={byId("interview")} {...common}>
        <InterviewLaptop active={hovered === "interview"} />
      </Hotspot>
      <Hotspot item={byId("exams")} {...common}>
        <Calendar theme={theme} />
      </Hotspot>

      <CameraRig focus={focus} reducedMotion={reducedMotion} />
    </>
  );
};

export default StudyDeskScene;
