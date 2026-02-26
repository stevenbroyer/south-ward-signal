// @ts-nocheck
'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─── Performance Tiers ──────────────────────────────────── */

type Tier = 'high' | 'medium' | 'low';

interface TierConfig {
  risingParticles: number;
  orbitingParticles: number;
  sparkles: number;
  hexGround: boolean;
  bloom: boolean;
  bloomIntensity: number;
  thirdRing: boolean;
  mouseTrack: boolean;
  dpr: [number, number];
  antialias: boolean;
}

const TIER_CONFIGS: Record<Tier, TierConfig> = {
  high: {
    risingParticles: 120,
    orbitingParticles: 20,
    sparkles: 40,
    hexGround: true,
    bloom: true,
    bloomIntensity: 0.6,
    thirdRing: true,
    mouseTrack: true,
    dpr: [1, 2],
    antialias: true,
  },
  medium: {
    risingParticles: 60,
    orbitingParticles: 10,
    sparkles: 20,
    hexGround: true,
    bloom: true,
    bloomIntensity: 0.3,
    thirdRing: true,
    mouseTrack: true,
    dpr: [1, 1.5],
    antialias: true,
  },
  low: {
    risingParticles: 30,
    orbitingParticles: 0,
    sparkles: 10,
    hexGround: false,
    bloom: false,
    bloomIntensity: 0,
    thirdRing: false,
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

/* ─── Hex Ground Plane ───────────────────────────────────── */

const hexVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hexFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  // Hex distance function
  float hexDist(vec2 p) {
    p = abs(p);
    return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
  }

  vec4 hexCoords(vec2 uv) {
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    vec2 gv = length(a) < length(b) ? a : b;
    float x = atan(gv.x, gv.y);
    float y = 0.5 - hexDist(gv);
    return vec4(gv, x, y);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 20.0;
    vec4 hc = hexCoords(uv);

    // Hex edge lines
    float edge = smoothstep(0.0, 0.05, hc.w) - smoothstep(0.05, 0.1, hc.w);

    // Radial fade
    float dist = length(vUv - 0.5) * 2.0;
    float fade = 1.0 - smoothstep(0.3, 0.9, dist);

    // Subtle pulse
    float pulse = 0.7 + 0.3 * sin(uTime * 0.5 + dist * 3.0);

    float alpha = edge * fade * pulse * 0.12;
    gl_FragColor = vec4(0.93, 0.1, 0.24, alpha);
  }
`;

function HexGround() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[30, 30, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={hexVertexShader}
        fragmentShader={hexFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Pitch Grid with Draw-in Animation ──────────────────── */

function PitchGrid() {
  const gridRef = useRef<THREE.Group>(null);
  const lineRefs = useRef<THREE.Line[]>([]);
  const circleRef = useRef<THREE.Line>(null);
  const startTime = useRef<number | null>(null);

  const lines = useMemo(() => {
    const pts: Array<{ start: [number, number, number]; end: [number, number, number]; opacity: number }> = [];
    // Horizontal lines
    for (let i = -6; i <= 6; i += 1.5) {
      pts.push({
        start: [-8, -2, i],
        end: [8, -2, i],
        opacity: 0.06 + Math.random() * 0.04,
      });
    }
    // Vertical lines
    for (let i = -8; i <= 8; i += 2) {
      pts.push({
        start: [i, -2, -6],
        end: [i, -2, 6],
        opacity: 0.06 + Math.random() * 0.04,
      });
    }
    return pts;
  }, []);

  // Center circle geometry (dashed)
  const circleGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 2, -2.01, Math.sin(angle) * 2));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame(({ clock }) => {
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;
    const drawProgress = Math.min(elapsed / 2.0, 1.0); // 2s draw-in

    // Animate line dash offset for draw-in effect
    lineRefs.current.forEach((line) => {
      if (line?.material) {
        const mat = line.material as THREE.LineDashedMaterial;
        mat.dashSize = 100 * drawProgress;
        mat.gapSize = 100 * (1 - drawProgress);
      }
    });

    if (circleRef.current?.material) {
      const mat = circleRef.current.material as THREE.LineDashedMaterial;
      mat.dashSize = 100 * drawProgress;
      mat.gapSize = 100 * (1 - drawProgress);
    }

    if (gridRef.current) {
      gridRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.02;
    }
  });

  return (
    <group ref={gridRef} position={[0, -1, 0]} rotation={[-0.3, 0, 0]}>
      {lines.map((line, i) => (
        <DrawLine
          key={i}
          start={line.start}
          end={line.end}
          opacity={line.opacity}
          ref={(el: THREE.Line) => { lineRefs.current[i] = el; }}
        />
      ))}
      {/* Center circle */}
      <line ref={circleRef} geometry={circleGeometry}>
        <lineDashedMaterial
          color="#ED1A3D"
          transparent
          opacity={0.08}
          dashSize={0}
          gapSize={100}
        />
      </line>
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

import { forwardRef } from 'react';

const DrawLine = forwardRef<
  THREE.Line,
  { start: [number, number, number]; end: [number, number, number]; opacity: number }
>(function DrawLine({ start, end, opacity }, ref) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([...start, ...end]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [start, end]);

  return (
    <line ref={ref} geometry={geometry}>
      <lineDashedMaterial
        color="#ED1A3D"
        transparent
        opacity={opacity}
        dashSize={0}
        gapSize={100}
      />
    </line>
  );
});

/* ─── Soccer Ball (Enhanced) ─────────────────────────────── */

function SoccerBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
      meshRef.current.position.y = Math.sin(t * 0.5) * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.2;
      innerRef.current.rotation.z = t * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = t * 0.1;
      const s = 1.8 + Math.sin(t * 2) * 0.1;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[2.5, 0.3, -1]}>
      {/* Main wireframe ball */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color="#F5F5F7"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      </Float>

      {/* Inner nested sphere — rotates opposite */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color="#ED1A3D"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#ED1A3D"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Core energy with distort */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <MeshDistortMaterial
          color="#ED1A3D"
          transparent
          opacity={0.6}
          distort={0.4}
          speed={3}
          roughness={0}
        />
      </mesh>
    </group>
  );
}

/* ─── Rising Particles ───────────────────────────────────── */

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
    return Array.from({ length: count }, () => 0.2 + Math.random() * 0.5);
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += speeds[i] * 0.003;
      posArray[i * 3] += Math.sin(t * 0.5 + i) * 0.001;
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
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Orbiting Particles ─────────────────────────────────── */

function OrbitingParticles({ count }: { count: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const orbits = useMemo(() => {
    return Array.from({ length: count }, () => ({
      radiusX: 1.8 + Math.random() * 2.5,
      radiusZ: 1.2 + Math.random() * 2.0,
      speed: 0.2 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
      yOffset: (Math.random() - 0.5) * 1.5,
    }));
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const orb = orbits[i];
      const angle = t * orb.speed + orb.offset;
      // Ball center offset
      posArray[i * 3] = 2.5 + Math.cos(angle) * orb.radiusX;
      posArray[i * 3 + 1] = 0.3 + orb.yOffset + Math.sin(t * 0.3 + i) * 0.2;
      posArray[i * 3 + 2] = -1 + Math.sin(angle) * orb.radiusZ;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;

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
        color="#FF4D6A"
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Energy Rings (one 270° arc) ────────────────────────── */

function EnergyRings({ showThird }: { showThird: boolean }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Line>(null);

  // 270° arc geometry for the 3rd ring
  const arcGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 80;
    const arcAngle = (270 / 360) * Math.PI * 2;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * arcAngle;
      points.push(new THREE.Vector3(Math.cos(angle) * 3, Math.sin(angle) * 3, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.2;
      ring1Ref.current.rotation.z = t * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.15;
      ring2Ref.current.rotation.x = t * 0.08;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 0.12;
      ring3Ref.current.rotation.y = -t * 0.06;
    }
  });

  return (
    <group position={[2.5, 0.3, -1]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2, 0.008, 16, 100]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.12} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.5, 0.006, 16, 100]} />
        <meshBasicMaterial color="#FF4D6A" transparent opacity={0.08} />
      </mesh>
      {showThird && (
        <line ref={ring3Ref} geometry={arcGeometry}>
          <lineBasicMaterial color="#ED1A3D" transparent opacity={0.05} />
        </line>
      )}
    </group>
  );
}

/* ─── Camera Rig (mouse-track or auto-orbit) ─────────────── */

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
      const targetX = mousePos.current.x * 0.8;
      const targetY = -mousePos.current.y * 0.4 + 0.5;
      camera.position.x += (targetX - camera.position.x) * 0.02;
      camera.position.y += (targetY - camera.position.y) * 0.02;
    } else {
      // Auto-orbit for mobile
      const t = clock.getElapsedTime();
      camera.position.x = Math.sin(t * 0.15) * 0.6;
      camera.position.y = 0.5 + Math.sin(t * 0.1) * 0.15;
    }
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Main Scene ──────────────────────────────────────────── */

function Scene({ config }: { config: TierConfig }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#F5F5F7" />
      <pointLight position={[2.5, 1, 0]} intensity={1} color="#ED1A3D" distance={8} decay={2} />

      {config.hexGround && <HexGround />}
      <PitchGrid />
      <SoccerBall />
      <EnergyRings showThird={config.thirdRing} />
      <RisingParticles count={config.risingParticles} />
      <OrbitingParticles count={config.orbitingParticles} />

      <Sparkles
        count={config.sparkles}
        scale={15}
        size={1.5}
        speed={0.3}
        opacity={0.15}
        color="#ED1A3D"
      />

      <CameraRig mouseTrack={config.mouseTrack} />
      <fog attach="fog" args={['#0A0A0C', 6, 18]} />

      {config.bloom && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
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
        camera={{ position: [0, 0.5, 8], fov: 45, near: 0.1, far: 50 }}
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
