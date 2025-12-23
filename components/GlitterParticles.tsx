import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  isMusicPlaying: boolean;
}

const GlitterParticles: React.FC<Props> = ({ isMusicPlaying }) => {
  const count = 160;
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const jitterBases = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const h = (Math.random() - 0.5) * 16;
      const normalizedH = (h + 8) / 16;
      
      const maxRadius = (1 - normalizedH) * 7 + 1.2;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * maxRadius;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 1.5;
      
      jitterBases[i * 3] = (Math.random() - 0.5);
      jitterBases[i * 3 + 1] = (Math.random() - 0.5);
      jitterBases[i * 3 + 2] = (Math.random() - 0.5);
    }

    return { positions, phases, speeds, jitterBases };
  }, []);

  const colorPink = new THREE.Color('#FF00BB');
  const colorGold = new THREE.Color('#FFD700');

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colorAttr = pointsRef.current.geometry.attributes.color;

    for (let i = 0; i < count; i++) {
      const currentSpeed = isMusicPlaying ? particles.speeds[i] * 4 : particles.speeds[i];
      const breathing = (Math.sin(time * currentSpeed + particles.phases[i]) + 1) / 2;
      
      const mixedColor = new THREE.Color().copy(colorPink).lerp(colorGold, breathing);
      colorAttr.setXYZ(i, mixedColor.r, mixedColor.g, mixedColor.b);

      if (isMusicPlaying) {
        const shake = Math.sin(time * 25) * 0.08;
        posAttr.setXYZ(
          i,
          particles.positions[i * 3] + particles.jitterBases[i * 3] * shake,
          particles.positions[i * 3 + 1] + particles.jitterBases[i * 3 + 1] * shake,
          particles.positions[i * 3 + 2] + particles.jitterBases[i * 3 + 2] * shake
        );
      } else {
        posAttr.setXYZ(i, particles.positions[i * 3], particles.positions[i * 3 + 1], particles.positions[i * 3 + 2]);
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
};

export default GlitterParticles;