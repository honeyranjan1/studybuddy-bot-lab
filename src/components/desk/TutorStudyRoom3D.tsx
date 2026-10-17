import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import deskAsset from "@/assets/study-room/desk.glb.asset.json";
import chairAsset from "@/assets/study-room/chairDesk.glb.asset.json";
import screenAsset from "@/assets/study-room/computerScreen.glb.asset.json";
import keyboardAsset from "@/assets/study-room/computerKeyboard.glb.asset.json";
import booksAsset from "@/assets/study-room/books.glb.asset.json";
import lampAsset from "@/assets/study-room/lampRoundTable.glb.asset.json";
import shelfAsset from "@/assets/study-room/bookcaseOpen.glb.asset.json";

type ModelAsset = { url: string };

function createSurfaceTexture(kind: "wood" | "plaster" | "rug", dark: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  if (!context) return texture;

  if (kind === "wood") {
    context.fillStyle = dark ? "#332a27" : "#a98769";
    context.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 16; row += 1) {
      const y = row * 32;
      context.fillStyle = row % 3 === 0 ? (dark ? "#3a2f2b" : "#b28d6c") : (dark ? "#302725" : "#a47f61");
      context.fillRect(0, y, 512, 31);
      context.fillStyle = dark ? "#211d1c" : "#765b47";
      context.fillRect(0, y + 30, 512, 2);
      const joint = row % 2 === 0 ? 164 : 356;
      context.fillRect(joint, y, 2, 30);
      context.strokeStyle = dark ? "#59453a" : "#c5a582";
      context.lineWidth = 1;
      for (let grain = 0; grain < 4; grain += 1) {
        const gx = (row * 71 + grain * 113) % 490;
        context.beginPath();
        context.moveTo(gx, y + 5 + grain * 5);
        context.bezierCurveTo(gx + 24, y + 1 + grain * 5, gx + 44, y + 12 + grain * 4, gx + 78, y + 8 + grain * 4);
        context.stroke();
      }
    }
  } else if (kind === "plaster") {
    context.fillStyle = dark ? "#252a30" : "#d5d7d2";
    context.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 240; i += 1) {
      const x = (i * 127) % 512;
      const y = (i * 197) % 512;
      context.fillStyle = dark ? (i % 2 ? "#30353a" : "#20252b") : (i % 2 ? "#e0e1dd" : "#cdd0cb");
      context.fillRect(x, y, 1 + (i % 3), 1 + (i % 2));
    }
  } else {
    context.fillStyle = dark ? "#253b3e" : "#527775";
    context.fillRect(0, 0, 512, 512);
    context.strokeStyle = dark ? "#b8785f" : "#d18d70";
    context.lineWidth = 8;
    context.strokeRect(22, 22, 468, 468);
    context.strokeStyle = dark ? "#d3b68d" : "#e5c9a7";
    context.lineWidth = 2;
    context.strokeRect(38, 38, 436, 436);
    for (let i = 0; i < 8; i += 1) {
      const offset = 48 + i * 58;
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(0, offset);
      context.moveTo(512 - offset, 512);
      context.lineTo(512, 512 - offset);
      context.stroke();
    }
  }

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function Surface({ kind, dark }: { kind: "wood" | "plaster" | "rug"; dark: boolean }) {
  const texture = useMemo(() => createSurfaceTexture(kind, dark), [kind, dark]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <meshStandardMaterial map={texture} roughness={kind === "plaster" ? 1 : 0.86} />;
}

function Furniture({
  asset,
  fit,
  size,
  position,
  rotation = 0,
}: {
  asset: ModelAsset;
  fit: "width" | "height";
  size: number;
  position: [number, number, number];
  rotation?: number;
}) {
  const { scene } = useGLTF(asset.url);
  const model = useMemo(() => {
    const object = SkeletonUtils.clone(scene);
    const bounds = new THREE.Box3().setFromObject(object);
    const dimensions = bounds.getSize(new THREE.Vector3());
    const scale = size / Math.max(fit === "width" ? dimensions.x : dimensions.y, 0.001);
    object.scale.setScalar(scale);
    const scaledBounds = new THREE.Box3().setFromObject(object);
    object.position.set(
      -(scaledBounds.min.x + scaledBounds.max.x) / 2,
      -scaledBounds.min.y,
      -(scaledBounds.min.z + scaledBounds.max.z) / 2,
    );
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return object;
  }, [fit, scene, size]);

  return (
    <group position={position} rotation-y={rotation}>
      <primitive object={model} />
    </group>
  );
}

function StudyRoom({ dark }: { dark: boolean }) {
  const wallColor = dark ? "#aeb4ae" : "#f1f0ea";
  const deskTop = 2.88;

  return (
    <>
      <color attach="background" args={[dark ? "#171c20" : "#d9e0dc"]} />
      <fog attach="fog" args={[dark ? "#171c20" : "#d9e0dc", 12, 24]} />
      <ambientLight intensity={dark ? 0.72 : 1.15} />
      <directionalLight
        position={[-4, 8, 5]}
        intensity={dark ? 2.3 : 2.8}
        color={dark ? "#ffdfbb" : "#fff5df"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <pointLight position={[3, 4, -1]} intensity={dark ? 26 : 12} color="#e89b68" distance={14} decay={2} />
      <Environment>
        <Lightformer intensity={dark ? 1.5 : 2.5} position={[0, 8, 1]} scale={[8, 6, 1]} />
        <Lightformer intensity={1} color="#a8c9c8" position={[-7, 3, 1]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>

      <mesh position={[0, -0.17, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <Surface kind="wood" dark={dark} />
      </mesh>
      <mesh position={[0, 0.12, -4.4]} receiveShadow>
        <planeGeometry args={[15, 9]} />
        <Surface kind="plaster" dark={dark} />
      </mesh>
      <mesh position={[-7.2, 3.2, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <Surface kind="plaster" dark={dark} />
      </mesh>

      <mesh position={[0, 0.015, 1.9]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[6.8, 4.2]} />
        <Surface kind="rug" dark={dark} />
      </mesh>

      <Suspense fallback={null}>
        <Furniture asset={deskAsset} fit="width" size={5.55} position={[0, 0, 0.12]} />
        <Furniture asset={chairAsset} fit="height" size={2.08} position={[0, 0, 2.6]} rotation={Math.PI} />
        <Furniture asset={screenAsset} fit="width" size={1.55} position={[0, deskTop, -1.28]} />
        <Furniture asset={keyboardAsset} fit="width" size={1.75} position={[0, deskTop + 0.04, 0.78]} />
        <Furniture asset={lampAsset} fit="height" size={1.85} position={[-2.05, deskTop, -0.95]} rotation={-0.3} />
        <Furniture asset={shelfAsset} fit="height" size={3.55} position={[-5.25, 0.02, -3.7]} rotation={0} />
        <Furniture asset={booksAsset} fit="width" size={1.05} position={[-5.15, 1.28, -3.62]} rotation={-0.12} />
      </Suspense>

      <group position={[0, 0, -4.31]}>
        <mesh position={[0, 4.15, 0]}>
          <boxGeometry args={[3.8, 2.5, 0.12]} />
          <meshStandardMaterial color={dark ? "#536b70" : "#91aba6"} roughness={0.34} metalness={0.12} />
        </mesh>
        <mesh position={[0, 4.15, 0.08]}>
          <boxGeometry args={[0.07, 2.5, 0.05]} />
          <meshStandardMaterial color={dark ? "#3c332c" : "#78583f"} roughness={0.74} />
        </mesh>
        <mesh position={[0, 4.15, 0.09]}>
          <boxGeometry args={[3.8, 0.07, 0.05]} />
          <meshStandardMaterial color={dark ? "#3c332c" : "#78583f"} roughness={0.74} />
        </mesh>
      </group>

      <mesh position={[0, 5.35, -4.32]}>
        <boxGeometry args={[15, 0.14, 0.28]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.03, -3.98]}>
        <boxGeometry args={[15, 0.16, 0.32]} />
        <meshStandardMaterial color={dark ? "#6e6d62" : "#b7aa96"} roughness={0.78} />
      </mesh>
    </>
  );
}

export function TutorStudyRoom3D({ dark, className = "" }: { dark: boolean; className?: string }) {
  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0.3, 5.1, 12.4], fov: 38 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <Suspense fallback={null}>
          <StudyRoom dark={dark} />
        </Suspense>
      </Canvas>
    </div>
  );
}