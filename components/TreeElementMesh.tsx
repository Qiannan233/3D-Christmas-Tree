import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, TreeElement, MaterialType } from '../types';

interface Props {
  data: TreeElement;
  intensity: number; // 0 (tree) to 1 (exploded)
}

const TreeElementMesh: React.FC<Props> = ({ data, intensity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    targetPos.lerpVectors(data.treePos, data.scatterPos, intensity);
    
    const time = state.clock.getElapsedTime();
    const noise = Math.sin(time + parseFloat(data.id.split('-')[1] || '0') * 0.1) * 0.05;
    targetPos.y += noise;

    meshRef.current.position.lerp(targetPos, 0.1);
    meshRef.current.rotation.x += delta * 0.08;
    meshRef.current.rotation.y += delta * 0.12;
  });

  const renderGeometry = () => {
    const [w, h, d] = data.size;
    switch (data.type) {
      case ShapeType.RING:
        return <torusGeometry args={[w * 0.5, h * 0.15, 12, 24]} />;
      case ShapeType.DISK:
        return <cylinderGeometry args={[w * 0.6, w * 0.6, h, 24]} />;
      case ShapeType.SPHERE:
        return <sphereGeometry args={[w * 0.45, 24, 24]} />;
      case ShapeType.TRIANGLE:
        return <coneGeometry args={[w * 0.5, h, 3]} />;
      case ShapeType.BOX:
        return <boxGeometry args={[w, h, d]} />;
      case ShapeType.CYLINDER:
        return <cylinderGeometry args={[w * 0.4, w * 0.4, h, 24]} />;
      case ShapeType.CONE:
        return <coneGeometry args={[w * 0.5, h, 24]} />;
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  };

  const getMaterialProps = () => {
    switch (data.materialType) {
      case MaterialType.GLASS:
        // Frosted Glass (毛玻璃) Effect
        return {
          color: data.color,
          transmission: 0.95, // High light throughput
          thickness: 2.0,     // Simulate physical depth
          roughness: 0.65,    // Key for frosted look
          metalness: 0.02,
          transparent: true,
          opacity: 0.9,
          ior: 1.5,
          envMapIntensity: 0.3,
          clearcoat: 0.1,
          clearcoatRoughness: 0.1
        };
      case MaterialType.METAL:
        // Reduced Metalness - More like Matte Anodized Aluminum
        return {
          color: data.color,
          roughness: 0.75, 
          metalness: 0.4,  // Reduced from 0.9
          envMapIntensity: 0.4 
        };
      case MaterialType.WIREFRAME:
        return {
          color: data.color,
          wireframe: true,
          emissive: data.color,
          emissiveIntensity: 0.6
        };
      case MaterialType.DIFFUSE:
      default:
        return {
          color: data.color,
          roughness: 0.9,
          metalness: 0.0,
          envMapIntensity: 0.1
        };
    }
  };

  return (
    <mesh ref={meshRef} rotation={data.rotation}>
      {renderGeometry()}
      <meshPhysicalMaterial {...getMaterialProps()} />
    </mesh>
  );
};

export default TreeElementMesh;