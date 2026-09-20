import { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { DESK_ITEMS, type DeskItem } from "./deskItems";

const ACCENT = "#e5484d";
const PAPER = "#ede8dd";
const WOOD = "#6b4b34";
const DARK = "#1b1b1d";

type Props = {
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (item: DeskItem) => void;
  focus: string | null;
  reducedMotion: boolean;
};

function Hotspot({
  item,
  hovered,
  onHover,
  onSelect,
  children,
}: {
  item: DeskItem;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (item: DeskItem) => void;
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
    const s = 1 + t * 0.06;
    g.scale.setScalar(s);
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
        position={[0, 0.34, 0]}
        fontSize={0.085}
        color={isActive ? "#ffffff" : "#8b8b90"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor="#000000"
      >
        {item.label.toUpperCase()}
      </Text>
    </group>
  );
}

function Notebook() {
  return (
    <group rotation={[0, 0.35, 0]}>
      <RoundedBox args={[0.62, 0.05, 0.44]} radius={0.015} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={ACCENT} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.58, 0.04, 0.4]} radius={0.01} position={[0, 0.045, 0]} castShadow>
        <meshStandardMaterial color={PAPER} roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

function Flashcards() {
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
          <meshStandardMaterial color={i === 2 ? "#ffffff" : PAPER} roughness={0.9} />
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

function Monitor() {
  return (
    <group>
      <RoundedBox args={[1.5, 0.88, 0.05]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial color={DARK} roughness={0.5} metalness={0.2} />
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

function Laptop() {
  return (
    <group rotation={[0, -0.5, 0]}>
      <RoundedBox args={[0.72, 0.03, 0.5]} radius={0.012} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#45464b" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      <group position={[0, 0.02, -0.25]} rotation={[-1.15, 0, 0]}>
        <RoundedBox args={[0.72, 0.46, 0.022]} radius={0.012} smoothness={3} position={[0, 0.23, 0]} castShadow>
          <meshStandardMaterial color="#45464b" metalness={0.5} roughness={0.4} />
        </RoundedBox>
        <group position={[0, 0.23, 0]}>
          <Screen width={0.66} height={0.4} tint="#1d3b2a" />
        </group>
      </group>
    </group>
  );
}

function Calendar() {
  return (
    <group rotation={[0, -0.15, 0]}>
      <RoundedBox args={[0.46, 0.34, 0.03]} radius={0.015} smoothness={3} rotation={[-0.35, 0, 0]} position={[0, 0.14, 0]} castShadow>
        <meshStandardMaterial color="#f2efe8" roughness={0.9} />
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

function DeskSurface() {
  return (
    <group>
      <RoundedBox args={[5.2, 0.12, 2.4]} radius={0.04} smoothness={3} position={[0, 0.7, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.75} />
      </RoundedBox>
      {[-2.3, 2.3].map((x) => (
        <mesh key={x} position={[x, 0.32, 0]} castShadow>
          <boxGeometry args={[0.14, 0.76, 2.1]} />
          <meshStandardMaterial color="#4c3626" roughness={0.8} />
        </mesh>
      ))}
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#141416" roughness={0.95} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 3, -3.4]} receiveShadow>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial color="#1a1a1d" roughness={1} />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group position={[-2.05, 0.76, -0.5]}>
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
      <pointLight position={[0.3, 0.55, 0.3]} intensity={6} distance={4.5} decay={2} color="#ffd9a8" />
    </group>
  );
}

function Mug() {
  return (
    <group position={[0.85, 0.82, 0.78]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.16, 20]} />
        <meshStandardMaterial color="#e9e5dc" roughness={0.6} />
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const item = DESK_ITEMS.find((i) => i.id === focus);
    if (item) {
      desired.set(item.position[0] * 0.75, item.position[1] + 0.85, item.position[2] + 2.1);
      target.lerp(new THREE.Vector3(item.position[0], item.position[1], item.position[2]), 1 - Math.exp(-5 * dt));
    } else {
      const px = reducedMotion ? 0 : pointer.x;
      const py = reducedMotion ? 0 : pointer.y;
      desired.set(px * 1.1, 2.1 + py * 0.35, 4.6);
      target.lerp(new THREE.Vector3(px * 0.3, 1.0, 0), 1 - Math.exp(-3 * dt));
    }
    camera.position.lerp(desired, 1 - Math.exp(-4 * dt));
    camera.lookAt(target);
  });

  return null;
}

const StudyDeskScene = ({ hovered, onHover, onSelect, focus, reducedMotion }: Props) => {
  const byId = (id: string) => DESK_ITEMS.find((i) => i.id === id)!;

  return (
    <>
      <color attach="background" args={["#0d0d0f"]} />
      <fog attach="fog" args={["#0d0d0f", 8, 20]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 5, 2]} scale={[8, 6, 1]} />
        <Lightformer intensity={0.7} color="#9db6c9" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
      </Environment>

      <DeskSurface />
      <Lamp />
      <Mug />

      <Hotspot item={byId("notes")} hovered={hovered} onHover={onHover} onSelect={onSelect}>
        <Notebook />
      </Hotspot>
      <Hotspot item={byId("flashcards")} hovered={hovered} onHover={onHover} onSelect={onSelect}>
        <Flashcards />
      </Hotspot>
      <Hotspot item={byId("quiz")} hovered={hovered} onHover={onHover} onSelect={onSelect}>
        <QuizSheet />
      </Hotspot>
      <Hotspot item={byId("tutor")} hovered={hovered} onHover={onHover} onSelect={onSelect}>
        <Monitor />
      </Hotspot>
      <Hotspot item={byId("dsa")} hovered={hovered} onHover={onHover} onSelect={onSelect}>
        <Laptop />
      </Hotspot>
      <Hotspot item={byId("exams")} hovered={hovered} onHover={onHover} onSelect={onSelect}>
        <Calendar />
      </Hotspot>

      <CameraRig focus={focus} reducedMotion={reducedMotion} />
    </>
  );
};

export default StudyDeskScene;
