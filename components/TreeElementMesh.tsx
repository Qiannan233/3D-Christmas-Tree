
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, TreeElement, MaterialType } from '../types';
import '../types';

interface Props {
  data: TreeElement;
  intensity: number; 
  isMusicPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const TreeElementMesh: React.FC<Props> = ({ data, intensity, isMusicPlaying, audioRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 使用音频播放时间确保绝对同步
    const time = audioRef.current ? audioRef.current.currentTime : 0;
    
    let beatFactor = 0;
    if (isMusicPlaying) {
      const bpm = 120;
      const beatTrack = time * Math.PI * (bpm / 60);
      
      // 降低指数（2.5 -> 1.8）：使波形更饱满，跳动时的峰值更“圆润”，视觉上停留时间变长，从而感觉变慢
      beatFactor = Math.pow(Math.abs(Math.sin(beatTrack)), 1.8);
    }

    // 计算基础位置（树形与爆发态的线性插值）
    targetPos.lerpVectors(data.treePos, data.scatterPos, intensity);
    
    // 节奏位移方向：沿树体法线向外
    if (beatFactor > 0) {
      const dir = data.treePos.clone().normalize();
      if (data.treePos.length() > 0.01) {
        // 维持偏移幅度，位移速度通过 lerp 控制
        targetPos.addScaledVector(dir, 0.25 * beatFactor);
      } else {
        targetPos.y += 0.25 * beatFactor;
      }
    }

    // 关键修改：平滑追踪系数从 0.1 降到 0.05（慢了一倍）
    // 这会让零件对目标位置的响应变得非常迟缓、富有弹性，产生更深沉的节奏跟随感
    meshRef.current.position.lerp(targetPos, 0.05);
    
    // 旋转速度维持不变，保持艺术美感
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
        return {
          color: data.color,
          transmission: 0.95,
          thickness: 2.0,
          roughness: 0.65,
          metalness: 0.02,
          transparent: true,
          opacity: 0.9,
          ior: 1.5,
          envMapIntensity: 0.3,
          clearcoat: 0.1,
          clearcoatRoughness: 0.1
        };
      case MaterialType.METAL:
        return {
          color: data.color,
          roughness: 0.75, 
          metalness: 0.4,
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
