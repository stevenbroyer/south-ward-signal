// @ts-nocheck
'use client';

import { useRef, useMemo, useEffect, useState, forwardRef } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─── Performance Tiers ──────────────────────────────────── */

type Tier = 'high' | 'medium' | 'low';

interface TierConfig {
  risingParticles: number;
  sparkles: number;
  bloom: boolean;
  bloomIntensity: number;
  goalFrame: boolean;
  mouseTrack: boolean;
  dpr: [number, number];
  antialias: boolean;
}

const TIER_CONFIGS: Record<Tier, TierConfig> = {
  high: {
    risingParticles: 100,
    sparkles: 40,
    bloom: true,
    bloomIntensity: 0.5,
    goalFrame: true,
    mouseTrack: true,
    dpr: [1, 2],
    antialias: true,
  },
  medium: {
    risingParticles: 50,
    sparkles: 20,
    bloom: true,
    bloomIntensity: 0.3,
    goalFrame: true,
    mouseTrack: true,
    dpr: [1, 1.5],
    antialias: true,
  },
  low: {
    risingParticles: 25,
    sparkles: 10,
    bloom: false,
    bloomIntensity: 0,
    goalFrame: false,
    mouseTrack: false,
    dpr: [1, 1],
    antialias: false,
  },
};

function detectTier(): Tier {
  if (typeof window === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  if (isMobile || cores <= 4) return 'low';
  if (cores >= 8) return 'high';
  return 'medium';
}

/* ─── RBNY Crest (floating textured plane) ───────────────── */

function RBNYCrest() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, '/images/rbny-crest.png');

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = 0.8 + Math.sin(t * 0.6) * 0.12;
      meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
    }
    if (glowRef.current) {
      const pulse = 1.0 + Math.sin(t * 1.5) * 0.06;
      glowRef.current.scale.setScalar(pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 2) * 0.03;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Red glow behind the crest */}
      <mesh ref={glowRef} position={[0, 0.8, -0.1]}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Crest */}
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.15}>
        <mesh ref={meshRef}>
          <planeGeometry args={[2.8, 2.8 * (2000 / 2400)]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Float>

      {/* Subtle ring around the crest */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.006, 16, 100]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

/* ─── Soccer Ball (proper pentagon pattern) ──────────────── */

function SoccerBall() {
  const groupRef = useRef<THREE.Group>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = -0.8 + Math.sin(t * 0.8) * 0.1;
      groupRef.current.position.x = 3.5 + Math.sin(t * 0.4) * 0.15;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.3;
      wireRef.current.rotation.x = t * 0.15;
      wireRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[3.5, -0.8, -2]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        {/* Wireframe truncated icosahedron — classic soccer ball shape */}
        <mesh ref={wireRef}>
          <dodecahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial
            color="#F5F5F7"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
        {/* Inner core glow */}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#ED1A3D" transparent opacity={0.15} />
        </mesh>
      </Float>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

/* ─── Goal Frame ─────────────────────────────────────────── */

function GoalFrame() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.03;
    }
  });

  const postMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#F5F5F7', transparent: true, opacity: 0.08 }),
    []
  );

  const netMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#F5F5F7',
        wireframe: true,
        transparent: true,
        opacity: 0.03,
      }),
    []
  );

  return (
    <group ref={groupRef} position={[0, -0.5, -6]} scale={[1.2, 1.2, 1.2]}>
      {/* Left post */}
      <mesh position={[-3.66, 1.22, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.44, 8]} />
        <primitive object={postMaterial} attach="material" />
      </mesh>
      {/* Right post */}
      <mesh position={[3.66, 1.22, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.44, 8]} />
        <primitive object={postMaterial} attach="material" />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 2.44, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 7.32, 8]} />
        <primitive object={postMaterial} attach="material" />
      </mesh>
      {/* Net (back panel — simplified) */}
      <mesh position={[0, 1.22, -1.5]}>
        <planeGeometry args={[7.32, 2.44, 12, 6]} />
        <primitive object={netMaterial} attach="material" />
      </mesh>
      {/* Net (top panel) */}
      <mesh position={[0, 2.44, -0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.32, 1.5, 12, 3]} />
        <primitive object={netMaterial} attach="material" />
      </mesh>
    </group>
  );
}

/* ─── Soccer Pitch (recognizable field lines) ────────────── */

function SoccerPitch() {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);

  // Center circle
  const centerCircle = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Penalty arc (top of 18-yard box)
  const penaltyArc = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (-Math.PI * 0.35) + (i / 32) * (Math.PI * 0.7);
      points.push(new THREE.Vector3(Math.cos(angle) * 2, 0, -8 + Math.sin(angle) * 2));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const lineMat = useMemo(
    () => ({ color: '#ED1A3D', transparent: true, opacity: 0.1 }),
    []
  );

  useFrame(({ clock }) => {
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]} rotation={[-0.25, 0, 0]}>
      {/* Touchlines (field border) */}
      <PitchLine start={[-8, 0, -6]} end={[8, 0, -6]} opacity={0.08} />
      <PitchLine start={[-8, 0, 6]} end={[8, 0, 6]} opacity={0.08} />
      <PitchLine start={[-8, 0, -6]} end={[-8, 0, 6]} opacity={0.08} />
      <PitchLine start={[8, 0, -6]} end={[8, 0, 6]} opacity={0.08} />

      {/* Halfway line */}
      <PitchLine start={[-8, 0, 0]} end={[8, 0, 0]} opacity={0.12} />

      {/* Center circle */}
      <line geometry={centerCircle}>
        <lineBasicMaterial {...lineMat} />
      </line>

      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.2} />
      </mesh>

      {/* Penalty box (far end) */}
      <PitchLine start={[-5, 0, -6]} end={[-5, 0, -10]} opacity={0.07} />
      <PitchLine start={[5, 0, -6]} end={[5, 0, -10]} opacity={0.07} />
      <PitchLine start={[-5, 0, -10]} end={[5, 0, -10]} opacity={0.07} />

      {/* Penalty arc */}
      <line geometry={penaltyArc}>
        <lineBasicMaterial color="#ED1A3D" transparent opacity={0.06} />
      </line>

      {/* Goal box (6-yard, far end) */}
      <PitchLine start={[-2.5, 0, -6]} end={[-2.5, 0, -8]} opacity={0.06} />
      <PitchLine start={[2.5, 0, -6]} end={[2.5, 0, -8]} opacity={0.06} />
      <PitchLine start={[-2.5, 0, -8]} end={[2.5, 0, -8]} opacity={0.06} />

      {/* Subtle grass texture — grid lines */}
      {Array.from({ length: 9 }, (_, i) => {
        const z = -6 + (i + 1) * (12 / 10);
        return <PitchLine key={`h${i}`} start={[-8, 0, z]} end={[8, 0, z]} opacity={0.03} />;
      })}
    </group>
  );
}

const PitchLine = forwardRef<
  THREE.Line,
  { start: [number, number, number]; end: [number, number, number]; opacity: number }
>(function PitchLine({ start, end, opacity }, ref) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([...start, ...end]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, [start, end]);

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#ED1A3D" transparent opacity={opacity} />
    </line>
  );
});

/* ─── Rising Particles (like smoke/flares from the stands) ── */

function RisingParticles({ count }: { count: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, [count]);

  const speeds = useMemo(() => {
    return Array.from({ length: count }, () => 0.15 + Math.random() * 0.4);
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += speeds[i] * 0.003;
      posArray[i * 3] += Math.sin(t * 0.4 + i * 0.7) * 0.0008;
      if (posArray[i * 3 + 1] > 6) {
        posArray[i * 3 + 1] = -4;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ED1A3D"
        size={0.03}
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Camera Rig ─────────────────────────────────────────── */

function CameraRig({ mouseTrack }: { mouseTrack: boolean }) {
  const { camera } = useThree();
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mouseTrack || typeof window === 'undefined') return;
    const handler = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mousePos.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseTrack]);

  useFrame(({ clock }) => {
    if (mouseTrack) {
      const targetX = mousePos.current.x * 1.0;
      const targetY = -mousePos.current.y * 0.5 + 1.0;
      camera.position.x += (targetX - camera.position.x) * 0.02;
      camera.position.y += (targetY - camera.position.y) * 0.02;
    } else {
      const t = clock.getElapsedTime();
      camera.position.x = Math.sin(t * 0.12) * 0.8;
      camera.position.y = 1.0 + Math.sin(t * 0.08) * 0.2;
    }
    camera.lookAt(0, 0.3, -1);
  });

  return null;
}

/* ─── Main Scene ──────────────────────────────────────────── */

function Scene({ config }: { config: TierConfig }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.4} color="#F5F5F7" />
      {/* Red spotlight on the crest — like a floodlight */}
      <pointLight position={[0, 3, 2]} intensity={1.5} color="#ED1A3D" distance={10} decay={2} />
      {/* Cool fill from behind */}
      <pointLight position={[0, 2, -4]} intensity={0.5} color="#557AB2" distance={8} decay={2} />

      <SoccerPitch />
      {config.goalFrame && <GoalFrame />}
      <RBNYCrest />
      <SoccerBall />
      <RisingParticles count={config.risingParticles} />

      <Sparkles
        count={config.sparkles}
        scale={15}
        size={1.5}
        speed={0.25}
        opacity={0.12}
        color="#ED1A3D"
      />

      <CameraRig mouseTrack={config.mouseTrack} />
      <fog attach="fog" args={['#0A0A0C', 8, 20]} />

      {config.bloom && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            intensity={config.bloomIntensity}
          />
        </EffectComposer>
      )}
    </>
  );
}

/* ─── Exported Component ──────────────────────────────────── */

export function SoccerScene() {
  const [config, setConfig] = useState<TierConfig>(TIER_CONFIGS.medium);

  useEffect(() => {
    const tier = detectTier();
    setConfig(TIER_CONFIGS[tier]);
  }, []);

  return (
    <div className="absolute inset-0 z-[1]">
      <Canvas
        camera={{ position: [0, 1, 8], fov: 42, near: 0.1, far: 50 }}
        dpr={config.dpr}
        gl={{
          antialias: config.antialias,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene config={config} />
      </Canvas>
    </div>
  );
}
