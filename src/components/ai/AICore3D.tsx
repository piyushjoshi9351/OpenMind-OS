"use client";

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AICore3DProps {
  activityLevel: number;
  productivity: number;
  syncActive?: boolean;
}

function CoreModel({ activityLevel, productivity, syncActive = false }: { activityLevel: number; productivity: number; syncActive?: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Mesh>(null);
  const innerPulseRef = useRef<THREE.Mesh>(null);
  const particleFieldRef = useRef<THREE.Points>(null);
  const particleStreamRef = useRef<THREE.Points>(null);
  const sparkParticlesRef = useRef<THREE.Points>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseScale = 1 + activityLevel / 260;
  const activityFactor = Math.max(0.15, Math.min(1.2, activityLevel / 100));
  const productivityFactor = Math.max(0, Math.min(1, productivity));

  const particles = useMemo(() => {
    const values = new Float32Array(800 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const radius = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      values[index] = radius * Math.sin(phi) * Math.cos(theta);
      values[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
      values[index + 2] = radius * Math.cos(phi);
    }
    return values;
  }, []);

  const streamParticles = useMemo(() => {
    const values = new Float32Array(420 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const angle = (index / 3) * 0.12;
      const radius = 1.95 + (Math.random() - 0.5) * 0.24;
      values[index] = Math.cos(angle) * radius;
      values[index + 1] = (Math.random() - 0.5) * 0.9;
      values[index + 2] = Math.sin(angle) * radius;
    }
    return values;
  }, []);

  const sparkParticles = useMemo(() => {
    const values = new Float32Array(140 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const radius = 0.8 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      values[index] = radius * Math.sin(phi) * Math.cos(theta);
      values[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
      values[index + 2] = radius * Math.cos(phi);
    }
    return values;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulseSpeed = 1.1 + activityFactor * 1.2;
    const pulse = baseScale + Math.sin(t * pulseSpeed) * 0.05;
    const flicker = (Math.random() - 0.5) * 0.09;

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.0038 + activityFactor * 0.0015;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
      coreRef.current.scale.setScalar(pulse);
    }

    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = 0.85 + activityFactor * 0.55 + flicker;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.0045;
      ringRef.current.rotation.x += 0.0024;
    }

    if (ringMaterialRef.current) {
      ringMaterialRef.current.emissiveIntensity = 0.52 + productivityFactor * 0.78 + flicker * 0.35;
    }

    if (orbitRef.current) {
      orbitRef.current.rotation.y -= 0.0028;
      orbitRef.current.rotation.x = Math.cos(t * 0.45) * 0.2;
    }

    if (innerPulseRef.current) {
      const innerScale = 0.88 + Math.sin(t * 2.4) * 0.045;
      innerPulseRef.current.scale.setScalar(innerScale);
    }

    if (particleFieldRef.current) {
      particleFieldRef.current.rotation.y += 0.0018 + activityFactor * 0.0012;
      particleFieldRef.current.rotation.x = Math.sin(t * 0.3) * 0.12;
    }

    if (particleStreamRef.current) {
      particleStreamRef.current.rotation.y -= 0.01 + activityFactor * 0.009;
      particleStreamRef.current.rotation.z = Math.sin(t * 0.8) * 0.22;
    }

    if (sparkParticlesRef.current) {
      sparkParticlesRef.current.visible = syncActive;
      sparkParticlesRef.current.rotation.y += 0.02;
      sparkParticlesRef.current.rotation.x = Math.sin(t * 1.2) * 0.35;
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[3, 3, 4]} intensity={2.4} color="#46a3ff" />
      <pointLight position={[-2, -1, 2]} intensity={1.4} color="#9a5dff" />

      <Float speed={2.2} rotationIntensity={0.35} floatIntensity={0.8}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.05, 1]} />
          <meshStandardMaterial ref={coreMaterialRef} color="#5bb5ff" emissive="#2f79ff" emissiveIntensity={0.95} metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh ref={innerPulseRef}>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshStandardMaterial color="#89d1ff" emissive="#5aa8ff" emissiveIntensity={0.55} transparent opacity={0.3} />
        </mesh>
      </Float>

      <mesh ref={ringRef}>
        <torusGeometry args={[1.7, 0.05, 18, 180]} />
        <meshStandardMaterial ref={ringMaterialRef} color="#87e6ff" emissive="#54c9ff" emissiveIntensity={0.9} transparent opacity={0.75} />
      </mesh>

      <mesh ref={orbitRef} rotation={[0.8, 0.4, 0]}>
        <torusGeometry args={[2.2, 0.035, 12, 130]} />
        <meshStandardMaterial color="#c6b4ff" emissive="#8f66ff" emissiveIntensity={0.75} transparent opacity={0.55} />
      </mesh>

      <Points ref={particleFieldRef} positions={particles} stride={3} frustumCulled>
        <PointMaterial transparent color="#8cc7ff" size={0.02 + activityFactor * 0.01} sizeAttenuation depthWrite={false} />
      </Points>

      <Points ref={particleStreamRef} positions={streamParticles} stride={3} frustumCulled>
        <PointMaterial transparent color="#b6a5ff" size={0.018 + activityFactor * 0.009} sizeAttenuation depthWrite={false} opacity={0.8} />
      </Points>

      <Points ref={sparkParticlesRef} positions={sparkParticles} stride={3} frustumCulled>
        <PointMaterial transparent color="#f9d38a" size={0.02} sizeAttenuation depthWrite={false} opacity={0.9} />
      </Points>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export function AICore3D({ activityLevel, productivity, syncActive = false }: AICore3DProps) {
  return (
    <div className="h-[360px] w-full">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <CoreModel activityLevel={activityLevel} productivity={productivity} syncActive={syncActive} />
      </Canvas>
    </div>
  );
}
