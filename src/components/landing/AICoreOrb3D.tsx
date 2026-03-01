"use client";

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function OrbModel() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const waveRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  const orbitParticles = useMemo(() => {
    const values = new Float32Array(220 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const angle = (index / 3) * 0.17;
      const radius = 2.05 + (Math.random() - 0.5) * 0.24;
      values[index] = Math.cos(angle) * radius;
      values[index + 1] = (Math.random() - 0.5) * 0.8;
      values[index + 2] = Math.sin(angle) * radius;
    }
    return values;
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const speed = hovered ? 1.85 : 1;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.44 * speed;
      coreRef.current.rotation.x = Math.sin(t * 0.35) * 0.18;
      const pulse = 1 + Math.sin(t * (Math.PI / 2)) * 0.055;
      coreRef.current.scale.setScalar(pulse);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.62 * speed;
      ringRef.current.rotation.x += delta * 0.18;
    }

    if (waveRef.current) {
      const waveScale = 1.18 + Math.sin(t * 1.45) * 0.09;
      waveRef.current.scale.setScalar(waveScale);
      waveRef.current.rotation.y -= delta * 0.2;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.58 * speed;
      particlesRef.current.rotation.x = Math.sin(t * 0.8) * 0.12;
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <pointLight position={[2.6, 2.8, 4]} intensity={2.2} color="#61b7ff" />
      <pointLight position={[-2.2, -1.5, 2]} intensity={1.2} color="#a66fff" />

      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh ref={coreRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <sphereGeometry args={[1.03, 48, 48]} />
          <meshStandardMaterial color="#67b7ff" emissive="#428fff" emissiveIntensity={1} roughness={0.18} metalness={0.72} />
        </mesh>
      </Float>

      <mesh ref={ringRef}>
        <torusGeometry args={[1.72, 0.05, 20, 180]} />
        <meshStandardMaterial color="#92ebff" emissive="#63d4ff" emissiveIntensity={1.2} transparent opacity={0.75} />
      </mesh>

      <mesh ref={waveRef}>
        <torusGeometry args={[1.22, 0.012, 8, 120]} />
        <meshStandardMaterial color="#b08dff" emissive="#9e7cff" emissiveIntensity={0.8} transparent opacity={0.65} />
      </mesh>

      <Points ref={particlesRef} positions={orbitParticles} stride={3} frustumCulled>
        <PointMaterial transparent color="#77d9ff" size={0.028} sizeAttenuation depthWrite={false} opacity={0.9} />
      </Points>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.45} />
    </>
  );
}

export function AICoreOrb3D() {
  return (
    <div className="relative h-[360px] w-[360px] max-w-full">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(100,171,255,0.35),transparent_64%)] blur-3xl" />
      <Canvas camera={{ position: [0, 0, 4.7], fov: 48 }} dpr={[1, 1.8]}>
        <OrbModel />
      </Canvas>
    </div>
  );
}
