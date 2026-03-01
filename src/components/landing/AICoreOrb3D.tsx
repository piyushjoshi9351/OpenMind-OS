"use client";

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function OrbModel() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringPrimaryRef = useRef<THREE.Mesh>(null);
  const ringSecondaryRef = useRef<THREE.Mesh>(null);
  const waveRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const haloParticlesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  const orbitParticles = useMemo(() => {
    const values = new Float32Array(420 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const angle = (index / 3) * 0.12;
      const radius = 2.4 + (Math.random() - 0.5) * 0.38;
      values[index] = Math.cos(angle) * radius;
      values[index + 1] = (Math.random() - 0.5) * 1.1;
      values[index + 2] = Math.sin(angle) * radius;
    }
    return values;
  }, []);

  const haloParticles = useMemo(() => {
    const values = new Float32Array(260 * 3);
    for (let index = 0; index < values.length; index += 3) {
      const radius = 2.9 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      values[index] = radius * Math.sin(phi) * Math.cos(theta);
      values[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
      values[index + 2] = radius * Math.cos(phi);
    }
    return values;
  }, []);

  useFrame(({ clock, pointer, camera }, delta) => {
    const t = clock.getElapsedTime();
    const speed = hovered ? 1.45 : 0.82;

    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, pointer.x * 0.38, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, pointer.y * 0.24, 0.05);
      groupRef.current.rotation.y += delta * 0.08;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.32, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.2, 0.03);
    camera.lookAt(0, 0, 0);

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.2 * speed;
      coreRef.current.rotation.x = Math.sin(t * 0.22) * 0.14;
      const pulse = 1 + Math.sin(t * (Math.PI / 2)) * 0.08;
      coreRef.current.scale.setScalar(pulse);
    }

    if (ringPrimaryRef.current) {
      ringPrimaryRef.current.rotation.z += delta * 0.34 * speed;
      ringPrimaryRef.current.rotation.x += delta * 0.12;
    }

    if (ringSecondaryRef.current) {
      ringSecondaryRef.current.rotation.y -= delta * 0.29 * speed;
      ringSecondaryRef.current.rotation.x = Math.sin(t * 0.36) * 0.42;
    }

    if (waveRef.current) {
      const waveScale = 1.22 + Math.sin(t * 1.45) * 0.14;
      waveRef.current.scale.setScalar(waveScale);
      waveRef.current.rotation.y -= delta * 0.16;
    }

    if (auraRef.current) {
      const auraScale = 1.36 + Math.sin(t * 1.1) * 0.08;
      auraRef.current.scale.setScalar(auraScale);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.42 * speed;
      particlesRef.current.rotation.x = Math.sin(t * 0.48) * 0.16;
    }

    if (haloParticlesRef.current) {
      haloParticlesRef.current.rotation.y -= delta * 0.08;
      haloParticlesRef.current.rotation.z = Math.sin(t * 0.3) * 0.16;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.95} />
      <pointLight position={[3.2, 3.2, 4.4]} intensity={2.7} color="#66bbff" />
      <pointLight position={[-2.8, -1.8, 2.4]} intensity={1.55} color="#a86eff" />
      <pointLight position={[0, -2.4, 3.4]} intensity={1.25} color="#6cf0ff" />

      <Float speed={1.25} rotationIntensity={0.3} floatIntensity={1.05}>
        <mesh ref={coreRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <sphereGeometry args={[1.22, 64, 64]} />
          <meshStandardMaterial color="#78c2ff" emissive="#4699ff" emissiveIntensity={1.2} roughness={0.16} metalness={0.78} />
        </mesh>
      </Float>

      <mesh ref={ringPrimaryRef}>
        <torusGeometry args={[2.04, 0.06, 24, 220]} />
        <meshStandardMaterial color="#95ecff" emissive="#63dbff" emissiveIntensity={1.4} transparent opacity={0.72} />
      </mesh>

      <mesh ref={ringSecondaryRef} rotation={[0.95, 0.32, 0.12]}>
        <torusGeometry args={[2.44, 0.04, 20, 210]} />
        <meshStandardMaterial color="#d0b9ff" emissive="#ac85ff" emissiveIntensity={1.1} transparent opacity={0.58} />
      </mesh>

      <mesh ref={waveRef}>
        <torusGeometry args={[1.46, 0.013, 10, 140]} />
        <meshStandardMaterial color="#b78fff" emissive="#a17dff" emissiveIntensity={0.95} transparent opacity={0.62} />
      </mesh>

      <mesh ref={auraRef}>
        <sphereGeometry args={[1.74, 42, 42]} />
        <meshStandardMaterial color="#88c7ff" emissive="#6ab4ff" emissiveIntensity={0.45} transparent opacity={0.14} />
      </mesh>

      <Points ref={particlesRef} positions={orbitParticles} stride={3} frustumCulled>
        <PointMaterial transparent color="#7ce0ff" size={0.03} sizeAttenuation depthWrite={false} opacity={0.9} />
      </Points>

      <Points ref={haloParticlesRef} positions={haloParticles} stride={3} frustumCulled>
        <PointMaterial transparent color="#b99eff" size={0.018} sizeAttenuation depthWrite={false} opacity={0.62} />
      </Points>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.18} />
    </group>
  );
}

export function AICoreOrb3D() {
  return (
    <div className="relative h-[460px] w-[460px] max-w-full">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(104,177,255,0.45),transparent_62%)] blur-3xl" />
      <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(172,116,255,0.22),transparent_62%)] blur-[68px]" />
      <Canvas camera={{ position: [0, 0, 5.9], fov: 44 }} dpr={[1, 2]}>
        <OrbModel />
      </Canvas>
    </div>
  );
}
