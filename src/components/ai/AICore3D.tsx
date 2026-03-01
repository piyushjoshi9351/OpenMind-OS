"use client";

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AICore3DProps {
  activityLevel: number;
}

function CoreModel({ activityLevel }: { activityLevel: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const baseScale = 1 + activityLevel / 260;

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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = baseScale + Math.sin(t * 1.8) * 0.04;

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.004;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
      coreRef.current.scale.setScalar(pulse);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.006;
      ringRef.current.rotation.x += 0.003;
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
          <meshStandardMaterial color="#5bb5ff" emissive="#2f79ff" emissiveIntensity={0.95} metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>

      <mesh ref={ringRef}>
        <torusGeometry args={[1.7, 0.05, 18, 180]} />
        <meshStandardMaterial color="#87e6ff" emissive="#54c9ff" emissiveIntensity={0.9} transparent opacity={0.75} />
      </mesh>

      <Points positions={particles} stride={3} frustumCulled>
        <PointMaterial transparent color="#8cc7ff" size={0.02} sizeAttenuation depthWrite={false} />
      </Points>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export function AICore3D({ activityLevel }: AICore3DProps) {
  return (
    <div className="h-[360px] w-full">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <CoreModel activityLevel={activityLevel} />
      </Canvas>
    </div>
  );
}
