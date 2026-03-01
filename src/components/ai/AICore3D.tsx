"use client";

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AICore3DProps {
  activityLevel: number;
  productivity: number;
  focusLevel?: number;
  consistencyLevel?: number;
  cognitiveLoad?: number;
  syncActive?: boolean;
  completionFlashKey?: number;
}

function CoreModel({
  activityLevel,
  productivity,
  focusLevel,
  consistencyLevel,
  cognitiveLoad,
  syncActive = false,
  completionFlashKey = 0,
}: {
  activityLevel: number;
  productivity: number;
  focusLevel?: number;
  consistencyLevel?: number;
  cognitiveLoad?: number;
  syncActive?: boolean;
  completionFlashKey?: number;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const focusRingRef = useRef<THREE.Mesh>(null);
  const consistencyRingRef = useRef<THREE.Mesh>(null);
  const loadRingRef = useRef<THREE.Mesh>(null);
  const processingRingRef = useRef<THREE.Mesh>(null);
  const coreShellRef = useRef<THREE.Mesh>(null);
  const particleFieldRef = useRef<THREE.Points>(null);
  const statusParticlesRef = useRef<THREE.Points>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const focusMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const consistencyMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const loadMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const processingMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashBoostRef = useRef(0);
  const lastFlashKeyRef = useRef(completionFlashKey);
  const activityFactor = Math.max(0.15, Math.min(1.2, activityLevel / 100));
  const productivityFactor = Math.max(0, Math.min(1, productivity));
  const focusFactor = Math.max(0, Math.min(1, (focusLevel ?? activityLevel) / 100));
  const consistencyFactor = Math.max(0, Math.min(1, (consistencyLevel ?? Math.round(productivity * 100)) / 100));
  const loadFactor = Math.max(0, Math.min(1, (cognitiveLoad ?? Math.round((1 - productivity) * 100)) / 100));
  const processingIntensity = Math.max(0.12, Math.min(1, activityFactor * 0.58 + consistencyFactor * 0.28 + (syncActive ? 0.18 : 0)));

  const particles = useMemo(() => {
    const values = new Float32Array(460 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const radius = 1.8 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      values[index] = radius * Math.sin(phi) * Math.cos(theta);
      values[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
      values[index + 2] = radius * Math.cos(phi);
    }
    return values;
  }, []);

  const statusParticles = useMemo(() => {
    const values = new Float32Array(260 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const angle = (index / 3) * 0.18;
      const radius = 2.05 + (Math.random() - 0.5) * 0.28;
      values[index] = Math.cos(angle) * radius;
      values[index + 1] = (Math.random() - 0.5) * 0.62;
      values[index + 2] = Math.sin(angle) * radius;
    }
    return values;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lastFlashKeyRef.current !== completionFlashKey) {
      lastFlashKeyRef.current = completionFlashKey;
      flashBoostRef.current = 0.9;
    }

    flashBoostRef.current = Math.max(0, flashBoostRef.current - 0.03);

    const pulseSpeed = 0.8 + processingIntensity * 1.8;
    const coreScale = 0.88 + Math.sin(t * pulseSpeed) * (0.03 + processingIntensity * 0.03) + (1 - loadFactor) * 0.05;
    const flicker = (Math.random() - 0.5) * 0.09;

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.0026 + consistencyFactor * 0.0024;
      coreRef.current.rotation.x = Math.sin(t * 0.38) * 0.08;
      coreRef.current.scale.setScalar(coreScale);
    }

    if (coreShellRef.current) {
      const shellScale = 1.02 + Math.sin(t * 1.1) * 0.02 + processingIntensity * 0.04;
      coreShellRef.current.scale.setScalar(shellScale);
    }

    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = 0.42 + (1 - loadFactor) * 0.75 + processingIntensity * 0.42 + flicker;
    }

    if (focusRingRef.current) {
      focusRingRef.current.rotation.z += 0.003 + focusFactor * 0.004;
      focusRingRef.current.rotation.x = Math.sin(t * 0.65) * 0.1;
      focusRingRef.current.scale.setScalar(0.95 + focusFactor * 0.15);
    }

    if (focusMaterialRef.current) {
      focusMaterialRef.current.emissiveIntensity = 0.34 + focusFactor * 1.05 + flashBoostRef.current * 0.28;
    }

    if (consistencyRingRef.current) {
      consistencyRingRef.current.rotation.y -= 0.0024 + consistencyFactor * 0.0032;
      consistencyRingRef.current.rotation.z = Math.cos(t * 0.46) * 0.18;
      consistencyRingRef.current.scale.setScalar(0.94 + consistencyFactor * 0.14);
    }

    if (consistencyMaterialRef.current) {
      consistencyMaterialRef.current.emissiveIntensity = 0.28 + consistencyFactor * 0.95 + flashBoostRef.current * 0.32;
    }

    if (loadRingRef.current) {
      loadRingRef.current.rotation.y += 0.0018 + loadFactor * 0.0028;
      loadRingRef.current.rotation.x = Math.sin(t * 0.58) * 0.16;
      loadRingRef.current.scale.setScalar(0.9 + loadFactor * 0.16);
    }

    if (loadMaterialRef.current) {
      loadMaterialRef.current.emissiveIntensity = 0.22 + loadFactor * 1.12;
    }

    if (processingRingRef.current) {
      processingRingRef.current.rotation.z += 0.006 + processingIntensity * 0.008;
      processingRingRef.current.rotation.x += 0.0015;
    }

    if (processingMaterialRef.current) {
      processingMaterialRef.current.emissiveIntensity = 0.36 + processingIntensity * 0.95 + flashBoostRef.current * 0.45;
    }

    if (particleFieldRef.current) {
      particleFieldRef.current.rotation.y += 0.001 + consistencyFactor * 0.0016;
      particleFieldRef.current.rotation.x = Math.sin(t * 0.26) * 0.08;
    }

    if (statusParticlesRef.current) {
      statusParticlesRef.current.visible = syncActive || processingIntensity > 0.62;
      statusParticlesRef.current.rotation.y -= 0.006 + processingIntensity * 0.01;
      statusParticlesRef.current.rotation.z = Math.sin(t * 0.74) * 0.18;
    }
  });

  return (
    <>
      <ambientLight intensity={0.62} />
      <pointLight position={[2.6, 2.5, 3.8]} intensity={1.85} color="#4fa8ff" />
      <pointLight position={[-1.8, -1.2, 2.5]} intensity={1.05} color="#9f73ff" />

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.38}>
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.9, 44, 44]} />
          <meshStandardMaterial ref={coreMaterialRef} color="#6abaff" emissive="#3d8fff" emissiveIntensity={0.75} metalness={0.62} roughness={0.28} />
        </mesh>

        <mesh ref={coreShellRef}>
          <sphereGeometry args={[1.04, 36, 36]} />
          <meshStandardMaterial color="#99d8ff" emissive="#6ab7ff" emissiveIntensity={0.26} transparent opacity={0.22} />
        </mesh>
      </Float>

      <mesh ref={focusRingRef}>
        <torusGeometry args={[1.82, 0.04, 16, 220]} />
        <meshStandardMaterial ref={focusMaterialRef} color="#8be5ff" emissive="#66d6ff" emissiveIntensity={0.7} transparent opacity={0.62} />
      </mesh>

      <mesh ref={consistencyRingRef} rotation={[0.85, 0.42, 0]}>
        <torusGeometry args={[1.48, 0.035, 14, 200]} />
        <meshStandardMaterial ref={consistencyMaterialRef} color="#c8b8ff" emissive="#9b7dff" emissiveIntensity={0.62} transparent opacity={0.52} />
      </mesh>

      <mesh ref={loadRingRef} rotation={[-0.62, 0.2, 0.8]}>
        <torusGeometry args={[1.16, 0.03, 12, 180]} />
        <meshStandardMaterial ref={loadMaterialRef} color="#ffbe8a" emissive="#ff9d6a" emissiveIntensity={0.46} transparent opacity={0.42} />
      </mesh>

      <mesh ref={processingRingRef} rotation={[0.25, 0.3, 0.15]}>
        <torusGeometry args={[2.15, 0.018, 8, 120]} />
        <meshStandardMaterial ref={processingMaterialRef} color="#9dd8ff" emissive="#71c2ff" emissiveIntensity={0.64} transparent opacity={0.45} />
      </mesh>

      <Points ref={particleFieldRef} positions={particles} stride={3} frustumCulled>
        <PointMaterial transparent color="#9bd3ff" size={0.012 + processingIntensity * 0.008} sizeAttenuation depthWrite={false} opacity={0.72} />
      </Points>

      <Points ref={statusParticlesRef} positions={statusParticles} stride={3} frustumCulled>
        <PointMaterial transparent color="#c7b6ff" size={0.015 + processingIntensity * 0.007} sizeAttenuation depthWrite={false} opacity={0.72} />
      </Points>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.25} />
    </>
  );
}

export function AICore3D({
  activityLevel,
  productivity,
  focusLevel,
  consistencyLevel,
  cognitiveLoad,
  syncActive = false,
  completionFlashKey = 0,
}: AICore3DProps) {
  return (
    <div className="h-[360px] w-full">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <CoreModel
          activityLevel={activityLevel}
          productivity={productivity}
          focusLevel={focusLevel}
          consistencyLevel={consistencyLevel}
          cognitiveLoad={cognitiveLoad}
          syncActive={syncActive}
          completionFlashKey={completionFlashKey}
        />
      </Canvas>
    </div>
  );
}
