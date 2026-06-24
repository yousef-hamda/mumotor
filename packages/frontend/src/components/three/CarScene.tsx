import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, ContactShadows } from '@react-three/drei';
import type { Group } from 'three';

const BODY = '#eef1f6';
const GLASS = '#1b2736';
const TIRE = '#15171d';
const HUB = '#c8cdd7';
const ACCENT = '#2444dc';

function Car() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3;
  });

  const Wheel = ({ x, z }: { x: number; z: number }) => (
    <group position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.34, 32]} />
        <meshStandardMaterial color={TIRE} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
        <meshStandardMaterial color={HUB} roughness={0.25} metalness={0.8} />
      </mesh>
    </group>
  );

  return (
    <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.45}>
      <group ref={ref} rotation={[0, 0.5, 0]} position={[0, -0.1, 0]}>
        {/* lower body */}
        <RoundedBox args={[3.3, 0.7, 1.5]} radius={0.28} smoothness={4} position={[0, 0.6, 0]} castShadow>
          <meshStandardMaterial color={BODY} metalness={0.5} roughness={0.32} />
        </RoundedBox>
        {/* greenhouse / glass */}
        <RoundedBox args={[1.7, 0.62, 1.28]} radius={0.22} smoothness={4} position={[-0.15, 1.05, 0]} castShadow>
          <meshStandardMaterial color={GLASS} metalness={0.4} roughness={0.08} />
        </RoundedBox>
        {/* roof */}
        <RoundedBox args={[1.25, 0.2, 1.3]} radius={0.12} smoothness={4} position={[-0.2, 1.36, 0]} castShadow>
          <meshStandardMaterial color={BODY} metalness={0.5} roughness={0.32} />
        </RoundedBox>
        {/* side accent stripes */}
        <RoundedBox args={[3.1, 0.07, 0.04]} radius={0.02} smoothness={2} position={[0, 0.58, 0.74]}>
          <meshStandardMaterial color={ACCENT} metalness={0.3} roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[3.1, 0.07, 0.04]} radius={0.02} smoothness={2} position={[0, 0.58, -0.74]}>
          <meshStandardMaterial color={ACCENT} metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* headlights */}
        <mesh position={[1.66, 0.62, 0.45]}>
          <boxGeometry args={[0.06, 0.16, 0.28]} />
          <meshStandardMaterial color="#ffffff" emissive="#dce6ff" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[1.66, 0.62, -0.45]}>
          <boxGeometry args={[0.06, 0.16, 0.28]} />
          <meshStandardMaterial color="#ffffff" emissive="#dce6ff" emissiveIntensity={0.6} />
        </mesh>
        <Wheel x={1.05} z={0.62} />
        <Wheel x={1.05} z={-0.62} />
        <Wheel x={-1.05} z={0.62} />
        <Wheel x={-1.05} z={-0.62} />
      </group>
    </Float>
  );
}

export function CarScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas shadows dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [3.9, 2.0, 4.8], fov: 32 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 9, 5]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-7, 4, -5]} intensity={0.5} color="#bcd0ff" />
        <pointLight position={[0, 3, 6]} intensity={0.4} />
        <Suspense fallback={null}>
          <Car />
          <ContactShadows position={[0, -0.02, 0]} opacity={0.35} blur={2.6} scale={11} far={4} />
        </Suspense>
      </Canvas>
    </div>
  );
}
