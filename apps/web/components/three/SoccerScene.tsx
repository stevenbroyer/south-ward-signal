// @ts-nocheck
'use client';

import { useRef, useMemo, useEffect, useState, forwardRef, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Detect device tier ─────────────────────────────────── */

type DeviceTier = 'mobile' | 'tablet' | 'desktop';

function getDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'mobile';
  const w = window.innerWidth;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (w < 768 || (isTouch && w < 768)) return 'mobile';
  if (w < 1024 || (isTouch && w < 1280)) return 'tablet';
  return 'desktop';
}

/* ─── RBNY Crest (floating textured plane) ───────────────── */

function RBNYCrest({ mobile, tier }: { mobile: boolean; tier: DeviceTier }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rawTexture = useLoader(THREE.TextureLoader, '/images/rbny-crest.png');

  // Swap blue pixels to black
  const texture = useMemo(() => {
    const img = rawTexture.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Detect blue-ish pixels (blue channel dominant, low red)
      if (b > 80 && b > r * 1.5 && b > g * 1.3) {
        data[i] = 20;      // R
        data[i + 1] = 20;  // G
        data[i + 2] = 25;  // B — near black
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [rawTexture]);

  const baseY = { mobile: 1.2, tablet: 1.3, desktop: 1.4 }[tier];
  const baseX = { mobile: 0, tablet: 1.2, desktop: 2.5 }[tier];
  const crestScale = { mobile: 3.0, tablet: 2.6, desktop: 2.8 }[tier];
  const isTouch = tier !== 'desktop';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = baseY + Math.sin(t * 0.6) * (isTouch ? 0.2 : 0.12);
      meshRef.current.position.x = baseX + (mobile ? Math.sin(t * 0.4) * 0.15 : 0);
      meshRef.current.rotation.y = Math.sin(t * 0.3) * (isTouch ? 0.1 : 0.08);
    }
  });


  return (
    <group position={[0, 0, mobile ? 1 : 0]}>
      <Float speed={isTouch ? 1.5 : 1.2} rotationIntensity={isTouch ? 0.08 : 0.05} floatIntensity={isTouch ? 0.3 : 0.15}>
        <mesh ref={meshRef}>
          <planeGeometry args={[crestScale, crestScale * (2000 / 2400)]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={1}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      </Float>

    </group>
  );
}

/* ─── Soccer Ball (click to shoot into goal) ─────────────── */

function SoccerBall() {
  const { scene } = useGLTF('/models/soccer-ball.glb');
  const groupRef = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState<'idle' | 'shooting' | 'bouncing' | 'resetting'>('idle');
  const progress = useRef(0);
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const spinSpeed = useRef(0);
  const [hovered, setHovered] = useState(false);

  // Positions for the shot arc
  const startPos = useMemo(() => new THREE.Vector3(3.0, -1.2, -3), []);
  const controlPos = useMemo(() => new THREE.Vector3(1.0, 2.0, -5), []);
  const targetPos = useMemo(() => new THREE.Vector3(0, 0.2, -7.2), []);
  // Ground level + ball radius so it bounces off the surface, not through it
  const ballRadius = 0.45;
  const groundY = -2.0 + ballRadius;
  const restPos = useRef(new THREE.Vector3());

  // Cursor change on hover
  useEffect(() => {
    document.body.style.cursor = hovered && phase === 'idle' ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered, phase]);

  const handleClick = () => {
    if (phase !== 'idle') return;
    setPhase('shooting');
    progress.current = 0;
  };

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    switch (phase) {
      case 'idle':
        groupRef.current.position.set(
          3.0 + Math.sin(t * 0.4) * 0.15,
          -1.2 + Math.sin(t * 0.8) * 0.05,
          -3
        );
        groupRef.current.rotation.x = -t * 1.2;
        groupRef.current.rotation.z = t * 0.3;
        break;

      case 'shooting': {
        progress.current = Math.min(progress.current + delta * 2.2, 1);
        const p = progress.current;
        const ip = 1 - p;
        groupRef.current.position.set(
          ip * ip * startPos.x + 2 * ip * p * controlPos.x + p * p * targetPos.x,
          ip * ip * startPos.y + 2 * ip * p * controlPos.y + p * p * targetPos.y,
          ip * ip * startPos.z + 2 * ip * p * controlPos.z + p * p * targetPos.z,
        );
        groupRef.current.rotation.x -= delta * 22;
        groupRef.current.rotation.z += delta * 8;

        if (p >= 1) {
          // Enter bounce phase with downward velocity from the shot arc
          velocity.current = { x: -0.3, y: -1.0, z: -0.2 };
          spinSpeed.current = 14;
          progress.current = 0;
          setPhase('bouncing');
        }
        break;
      }

      case 'bouncing': {
        progress.current += delta;
        const gravity = 12;
        const restitution = 0.5;
        const friction = 0.92;
        const v = velocity.current;
        const pos = groupRef.current.position;

        // Apply gravity
        v.y -= gravity * delta;

        // Update position
        pos.x += v.x * delta;
        pos.y += v.y * delta;
        pos.z += v.z * delta;

        // Ground collision
        if (pos.y <= groundY) {
          pos.y = groundY;
          v.y = Math.abs(v.y) * restitution;
          v.x *= friction;
          v.z *= friction;
          spinSpeed.current *= 0.6;

          // Stop bouncing when velocity is tiny
          if (v.y < 0.4) {
            v.y = 0;
            pos.y = groundY;
          }
        }

        // Spin decays
        groupRef.current.rotation.x -= delta * spinSpeed.current;
        groupRef.current.rotation.z += delta * spinSpeed.current * 0.3;
        spinSpeed.current *= (1 - delta * 2);

        // Settled: on ground with no vertical velocity, wait a beat then reset
        if (v.y === 0 && pos.y <= groundY + 0.01) {
          // Roll to a stop
          v.x *= (1 - delta * 4);
          v.z *= (1 - delta * 4);
          pos.x += v.x * delta;
          pos.z += v.z * delta;

          if (progress.current > 2.5) {
            restPos.current.copy(pos);
            progress.current = 0;
            setPhase('resetting');
          }
        }
        break;
      }

      case 'resetting': {
        progress.current = Math.min(progress.current + delta * 1.0, 1);
        const ep = 1 - Math.pow(1 - progress.current, 3);
        groupRef.current.position.lerpVectors(restPos.current, startPos, ep);
        groupRef.current.rotation.x = -t * 1.2;
        groupRef.current.rotation.z = t * 0.3;

        if (progress.current >= 1) {
          groupRef.current.scale.setScalar(1);
          setPhase('idle');
          progress.current = 0;
        }
        break;
      }
    }

    // Depth-based scale: shrink as ball moves away from camera (z=8)
    if (phase !== 'idle') {
      const camZ = 8;
      const idleDist = camZ - (-3); // 11 units at idle
      const curDist = camZ - groupRef.current.position.z;
      const s = idleDist / curDist;
      groupRef.current.scale.setScalar(s);
    }
  });

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={groupRef} position={[3.0, -1.2, -3]}>
      <primitive object={clonedScene} scale={[4, 4, 4]} />
      {/* Invisible click target sphere */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ─── Goal Frame (procedural — clean and recognizable) ──── */

function GoalFrame() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.03;
    }
  });

  const postMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#F5F5F7', transparent: true, opacity: 0.45 }),
    []
  );

  const netMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#F5F5F7', wireframe: true, transparent: true, opacity: 0.15 }),
    []
  );

  return (
    <group ref={groupRef} position={[0, -2, -6]} scale={[1.2, 1.2, 1.2]}>
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
      {/* Net — back */}
      <mesh position={[0, 1.22, -1.5]}>
        <planeGeometry args={[7.32, 2.44, 12, 6]} />
        <primitive object={netMaterial} attach="material" />
      </mesh>
      {/* Net — top */}
      <mesh position={[0, 2.44, -0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.32, 1.5, 12, 3]} />
        <primitive object={netMaterial} attach="material" />
      </mesh>
      {/* Net — left side */}
      <mesh position={[-3.66, 1.22, -0.75]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 2.44, 3, 6]} />
        <primitive object={netMaterial} attach="material" />
      </mesh>
      {/* Net — right side */}
      <mesh position={[3.66, 1.22, -0.75]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 2.44, 3, 6]} />
        <primitive object={netMaterial} attach="material" />
      </mesh>
    </group>
  );
}

/* ─── Soccer Pitch (field lines) ─────────────────────────── */

function SoccerPitch() {
  const groupRef = useRef<THREE.Group>(null);

  const centerCircle = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const penaltyArc = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (-Math.PI * 0.35) + (i / 32) * (Math.PI * 0.7);
      points.push(new THREE.Vector3(Math.cos(angle) * 2, 0, -8 + Math.sin(angle) * 2));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.02;
    }
  });

  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base green
    ctx.fillStyle = '#1a5c2a';
    ctx.fillRect(0, 0, 256, 256);

    // Mowed stripes (alternating light/dark bands)
    const stripeCount = 8;
    const stripeH = 256 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, i * stripeH, 256, stripeH);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, i * stripeH, 256, stripeH);
      }
    }

    // Grass grain noise
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const brightness = Math.random() > 0.5 ? 'rgba(100,180,80,0.08)' : 'rgba(0,40,0,0.06)';
      ctx.fillStyle = brightness;
      ctx.fillRect(x, y, 1, Math.random() * 3 + 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  }, []);

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Grass ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[24, 20]} />
        <meshBasicMaterial map={grassTexture} transparent opacity={0.35} />
      </mesh>

      {/* Field lines */}
      <PitchLine start={[-8, 0, -6]} end={[8, 0, -6]} opacity={0.08} />
      <PitchLine start={[-8, 0, 6]} end={[8, 0, 6]} opacity={0.08} />
      <PitchLine start={[-8, 0, -6]} end={[-8, 0, 6]} opacity={0.08} />
      <PitchLine start={[8, 0, -6]} end={[8, 0, 6]} opacity={0.08} />
      <PitchLine start={[-8, 0, 0]} end={[8, 0, 0]} opacity={0.12} />

      <line geometry={centerCircle}>
        <lineBasicMaterial color="#ED1A3D" transparent opacity={0.1} />
      </line>

      <PitchLine start={[-5, 0, -6]} end={[-5, 0, -10]} opacity={0.07} />
      <PitchLine start={[5, 0, -6]} end={[5, 0, -10]} opacity={0.07} />
      <PitchLine start={[-5, 0, -10]} end={[5, 0, -10]} opacity={0.07} />

      <line geometry={penaltyArc}>
        <lineBasicMaterial color="#ED1A3D" transparent opacity={0.06} />
      </line>

      <PitchLine start={[-2.5, 0, -6]} end={[-2.5, 0, -8]} opacity={0.06} />
      <PitchLine start={[2.5, 0, -6]} end={[2.5, 0, -8]} opacity={0.06} />
      <PitchLine start={[-2.5, 0, -8]} end={[2.5, 0, -8]} opacity={0.06} />

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

/* ─── Red Smoke Pyro (billboard sprites beside the goal) ── */

function useSmokeTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Build up a cloudy blob from many overlapping soft circles at random offsets
    const cx = size / 2;
    const cy = size / 2;
    for (let i = 0; i < 60; i++) {
      const ox = cx + (Math.random() - 0.5) * size * 0.5;
      const oy = cy + (Math.random() - 0.5) * size * 0.5;
      const r = 20 + Math.random() * 60;
      const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
      grad.addColorStop(0, 'rgba(237,26,61,0.08)');
      grad.addColorStop(0.5, 'rgba(200,20,40,0.04)');
      grad.addColorStop(1, 'rgba(237,26,61,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft outer fade so edges aren't hard
    const fade = ctx.createRadialGradient(cx, cy, size * 0.15, cx, cy, size * 0.5);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.6, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);
}

function SmokePuff({ position, delay, speed, scale: s, rotSpeed, opacityMul = 1 }: {
  position: [number, number, number]; delay: number; speed: number; scale: number; rotSpeed: number; opacityMul?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useSmokeTexture();
  const startY = position[1];
  const startX = position[0];
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock, camera }) => {
    if (!ref.current || !matRef.current) return;
    const t = ((clock.getElapsedTime() + delay) * speed) % 10;
    const progress = t / 10;

    // Rise, drift sideways, expand
    ref.current.position.y = startY + progress * 6;
    ref.current.position.x = startX + Math.sin(t * 0.5 + delay * 2) * 0.8;

    const grow = s * (1 + progress * 2);
    ref.current.scale.set(grow, grow, 1);

    // Always face camera (billboard)
    ref.current.quaternion.copy(camera.quaternion);
    // Slow rotation for organic feel
    ref.current.rotateZ(clock.getElapsedTime() * rotSpeed);

    // Fade: quick in, slow out
    const opacity = progress < 0.1 ? progress / 0.1 : Math.max(0, 1 - (progress - 0.1) / 0.9);
    matRef.current.opacity = opacity * 0.5 * opacityMul;
  });

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        ref={matRef}
        map={tex}
        transparent
        depthWrite={false}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function SmokePlumes({ mobile }: { mobile: boolean }) {
  const puffs = useMemo(() => {
    const arr: { position: [number, number, number]; delay: number; speed: number; scale: number; rotSpeed: number; opacityMul: number }[] = [];

    if (mobile) {
      // Mobile: concentrated behind crest, closer to camera, higher opacity
      const mobileSpreads = [
        { xOff: -2.0, zOff: 0.0, delay: 0.0, speed: 0.20, scale: 2.5, rot: 0.03 },
        { xOff: 0.0,  zOff: 0.5, delay: 1.5, speed: 0.18, scale: 3.0, rot: -0.02 },
        { xOff: 2.0,  zOff: 0.0, delay: 3.0, speed: 0.22, scale: 2.5, rot: 0.04 },
        { xOff: -1.0, zOff: 1.0, delay: 4.5, speed: 0.16, scale: 2.8, rot: -0.03 },
        { xOff: 1.0,  zOff: 0.3, delay: 6.0, speed: 0.24, scale: 2.2, rot: 0.02 },
        { xOff: -3.0, zOff: 0.5, delay: 2.0, speed: 0.20, scale: 2.0, rot: -0.04 },
        { xOff: 3.0,  zOff: 0.5, delay: 7.5, speed: 0.20, scale: 2.0, rot: 0.03 },
        { xOff: 0.5,  zOff: 1.5, delay: 8.5, speed: 0.14, scale: 3.2, rot: -0.02 },
        { xOff: -0.5, zOff: 0.0, delay: 5.0, speed: 0.26, scale: 2.6, rot: 0.05 },
      ];
      for (const s of mobileSpreads) {
        arr.push({
          position: [s.xOff, -1, -1 - s.zOff],
          delay: s.delay, speed: s.speed, scale: s.scale, rotSpeed: s.rot, opacityMul: 2.5,
        });
      }
      return arr;
    }

    // Desktop: original spread
    const sideSpreads = [
      { xOff: 0.0, zOff: 0.0, delay: 0.0, speed: 0.22, scale: 1.4, rot: 0.03 },
      { xOff: 0.8, zOff: 1.0, delay: 2.5, speed: 0.28, scale: 1.8, rot: -0.04 },
      { xOff: 1.5, zOff: 0.5, delay: 5.0, speed: 0.20, scale: 1.3, rot: 0.02 },
      { xOff: 0.3, zOff: 2.0, delay: 7.0, speed: 0.32, scale: 2.0, rot: -0.03 },
      { xOff: 1.2, zOff: 1.5, delay: 3.5, speed: 0.25, scale: 1.6, rot: 0.05 },
      { xOff: 0.6, zOff: 2.5, delay: 8.5, speed: 0.18, scale: 2.2, rot: -0.02 },
    ];
    for (const s of sideSpreads) {
      arr.push({
        position: [-6.5 + s.xOff, -2, -5 - s.zOff],
        delay: s.delay, speed: s.speed, scale: s.scale, rotSpeed: s.rot, opacityMul: 1,
      });
    }
    for (const s of sideSpreads) {
      arr.push({
        position: [5.5 + (2 - s.xOff), -2, -5 - s.zOff],
        delay: s.delay + 0.5, speed: s.speed, scale: s.scale, rotSpeed: -s.rot, opacityMul: 1,
      });
    }
    const centerSpreads = [
      { xOff: -1.5, zOff: 0.0, delay: 1.0, speed: 0.16, scale: 1.8, rot: 0.02 },
      { xOff: 0.5, zOff: 1.0, delay: 4.0, speed: 0.20, scale: 2.2, rot: -0.03 },
      { xOff: 1.8, zOff: 0.5, delay: 6.5, speed: 0.14, scale: 2.5, rot: 0.04 },
      { xOff: -0.5, zOff: 1.5, delay: 8.0, speed: 0.18, scale: 2.0, rot: -0.02 },
      { xOff: 0.8, zOff: 0.3, delay: 2.5, speed: 0.22, scale: 1.6, rot: 0.03 },
    ];
    for (const s of centerSpreads) {
      arr.push({
        position: [s.xOff, -2, -7 - s.zOff],
        delay: s.delay, speed: s.speed, scale: s.scale, rotSpeed: s.rot, opacityMul: 1,
      });
    }
    return arr;
  }, [mobile]);

  return (
    <>
      {puffs.map((p, i) => (
        <SmokePuff key={i} {...p} />
      ))}
    </>
  );
}

/* ─── Embers (rising from smoke/goal area only) ──────────── */

function Embers({ count }: { count: number }) {
  const meshRef = useRef<THREE.Points>(null);

  // Spawn embers only around the goal/smoke zone
  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // X: spread across goal width + smoke sides (-8 to 8)
      pos[i * 3] = (Math.random() - 0.5) * 16;
      // Y: start from field level, rise upward (-2 to 4)
      pos[i * 3 + 1] = -2 + Math.random() * 6;
      // Z: behind/around the goal (-4 to -9)
      pos[i * 3 + 2] = -4 - Math.random() * 5;
      // Varied sizes for depth
      sz[i] = 0.02 + Math.random() * 0.06;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  const speeds = useMemo(() => {
    return Array.from({ length: count }, () => ({
      rise: 0.003 + Math.random() * 0.008,
      drift: 0.3 + Math.random() * 0.8,
      flicker: 2 + Math.random() * 4,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const sizeArray = meshRef.current.geometry.attributes.size.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      // Rise
      posArray[i * 3 + 1] += speeds[i].rise;
      // Drift sideways
      posArray[i * 3] += Math.sin(t * speeds[i].drift + i * 1.3) * 0.002;
      // Reset when too high
      if (posArray[i * 3 + 1] > 5) {
        posArray[i * 3 + 1] = -2;
        posArray[i * 3] = (Math.random() - 0.5) * 16;
      }
      // Flicker size
      sizeArray[i] = sizes[i] * (0.6 + Math.sin(t * speeds[i].flicker + i) * 0.4);
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        color="#FF6B35"
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
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

function Scene({ showGoal, mobile, tier }: { showGoal: boolean; mobile: boolean; tier: DeviceTier }) {
  return (
    <>
      <ambientLight intensity={0.7} color="#F5E8EA" />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#FFD5DC" />
      <pointLight position={[0, 3, 2]} intensity={1.5} color="#ED1A3D" distance={10} decay={2} />

      {showGoal && tier === 'desktop' && <GoalFrame />}

      <Suspense fallback={null}>
        <RBNYCrest mobile={mobile} tier={tier} />
        {tier === 'desktop' && <SoccerBall />}
        {tier === 'desktop' && <SoccerPitch />}
      </Suspense>

      <SmokePlumes mobile={mobile} />
      <Embers count={mobile ? 15 : tier === 'tablet' ? 25 : 40} />

      <CameraRig mouseTrack={tier === 'desktop'} />
      <fog attach="fog" args={['#0A0A0C', 8, 20]} />
    </>
  );
}

/* ─── Exported Component ──────────────────────────────────── */

export function SoccerScene() {
  const [tier, setTier] = useState<DeviceTier>('mobile');
  const [contextLost, setContextLost] = useState(false);
  const mobile = tier === 'mobile';

  useEffect(() => {
    setTier(getDeviceTier());
  }, []);

  // CSS fallback only on WebGL context loss
  if (contextLost) {
    return (
      <div className="absolute inset-0 z-[1]">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(237,26,61,0.2) 0%, rgba(237,26,61,0.06) 40%, transparent 70%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[1]">
      <Canvas
        camera={{
          position: [0, mobile ? 2 : tier === 'tablet' ? 1.5 : 1, 8],
          fov: mobile ? 50 : tier === 'tablet' ? 46 : 42,
          near: 0.1, far: 50,
        }}
        dpr={mobile ? [1, 1] : tier === 'tablet' ? [1, 1.25] : [1, 1.5]}
        gl={{
          antialias: tier === 'desktop',
          alpha: true,
          powerPreference: mobile ? 'low-power' : 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
        }}
      >
        <Scene showGoal={true} mobile={mobile} tier={tier} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/soccer-ball.glb');
