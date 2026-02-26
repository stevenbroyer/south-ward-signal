'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Soccer Ball ─────────────────────────────────────────── */

function SoccerBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
      meshRef.current.position.y = Math.sin(t * 0.5) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = t * 0.1;
      const s = 1.8 + Math.sin(t * 2) * 0.1;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[2.5, 0.3, -1]}>
      {/* Main ball */}
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

      {/* Inner glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#ED1A3D"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Core energy */}
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

/* ─── Pitch Grid ──────────────────────────────────────────── */

function PitchGrid() {
  const gridRef = useRef<THREE.Group>(null);

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
    // Center circle
    return pts;
  }, []);

  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.02;
    }
  });

  return (
    <group ref={gridRef} position={[0, -1, 0]} rotation={[-0.3, 0, 0]}>
      {lines.map((line, i) => (
        <Line key={i} start={line.start} end={line.end} opacity={line.opacity} />
      ))}
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]}>
        <ringGeometry args={[2, 2.04, 64]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.08} />
      </mesh>
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function Line({ start, end, opacity }: { start: [number, number, number]; end: [number, number, number]; opacity: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([...start, ...end]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, [start, end]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#ED1A3D" transparent opacity={opacity} />
    </line>
  );
}

/* ─── Floating Data Particles ─────────────────────────────── */

function DataParticles() {
  const count = 80;
  const meshRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, []);

  const speeds = useMemo(() => {
    return Array.from({ length: count }, () => 0.2 + Math.random() * 0.5);
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += speeds[i] * 0.003;
      posArray[i * 3] += Math.sin(t * 0.5 + i) * 0.001;

      // Reset particles that float too high
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

/* ─── Energy Rings ────────────────────────────────────────── */

function EnergyRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

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
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3, 0.004, 16, 100]} />
        <meshBasicMaterial color="#ED1A3D" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

/* ─── Camera Rig (follows mouse) ──────────────────────────── */

function CameraRig() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 8));
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mousePos.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  useFrame(() => {
    // Lerp camera position based on mouse
    const targetX = mousePos.current.x * 0.8;
    const targetY = -mousePos.current.y * 0.4 + 0.5;

    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  // Attach mouse listener
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  return null;
}

/* ─── Main Scene ──────────────────────────────────────────── */

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#F5F5F7" />
      <pointLight position={[2.5, 1, 0]} intensity={1} color="#ED1A3D" distance={8} decay={2} />

      <PitchGrid />
      <SoccerBall />
      <EnergyRings />
      <DataParticles />

      <Sparkles
        count={40}
        scale={15}
        size={1.5}
        speed={0.3}
        opacity={0.15}
        color="#ED1A3D"
      />

      <CameraRig />
      <fog attach="fog" args={['#0A0A0C', 6, 18]} />
    </>
  );
}

export function SoccerScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0.5, 8], fov: 45, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
