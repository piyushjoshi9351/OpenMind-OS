"use client";

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NODE_COUNT = 84;

function NeuralMesh() {
  const groupRef = useRef<THREE.Group>(null);

  const nodePositions = useMemo(() => {
    const values = new Float32Array(NODE_COUNT * 3);
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (Math.random() - 0.5) * 18;
      values[index + 1] = (Math.random() - 0.5) * 10;
      values[index + 2] = (Math.random() - 0.5) * 8;
    }
    return values;
  }, []);

  const linePositions = useMemo(() => {
    const nodes: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < nodePositions.length; i += 3) {
      nodes.push({
        x: nodePositions[i],
        y: nodePositions[i + 1],
        z: nodePositions[i + 2],
      });
    }

    const segments: number[] = [];
    nodes.forEach((node, index) => {
      const nextA = nodes[(index + 1) % nodes.length];
      const nextB = nodes[(index + 9) % nodes.length];
      const nextC = nodes[(index + 17) % nodes.length];

      [nextA, nextB, nextC].forEach((nextNode) => {
        const distance = Math.sqrt(
          (node.x - nextNode.x) ** 2 +
          (node.y - nextNode.y) ** 2 +
          (node.z - nextNode.z) ** 2,
        );

        if (distance <= 7.4) {
          segments.push(node.x, node.y, node.z, nextNode.x, nextNode.y, nextNode.z);
        }
      });
    });

    return new Float32Array(segments);
  }, [nodePositions]);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.03;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.pointer.y * 0.15, 0.03);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, state.pointer.x * 0.95, 0.02);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, state.pointer.y * 0.45, 0.02);
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nodePositions, 3]}
            count={nodePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#6fd3ff" transparent opacity={0.82} sizeAttenuation depthWrite={false} />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={linePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#7d8fff" transparent opacity={0.22} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nodePositions, 3]}
            count={nodePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.16} color="#6d67ff" transparent opacity={0.12} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}

export function NeuralBackground3D() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      <Canvas camera={{ position: [0, 0, 14], fov: 50 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#04050d", 8, 22]} />
        <ambientLight intensity={0.8} />
        <pointLight position={[0, 4, 8]} intensity={1.4} color="#5fb4ff" />
        <pointLight position={[-4, -3, 5]} intensity={0.8} color="#9a6cff" />
        <NeuralMesh />
      </Canvas>
    </div>
  );
}
