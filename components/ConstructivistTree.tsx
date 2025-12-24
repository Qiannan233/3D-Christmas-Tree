
import React from 'react';
import { TreeElement } from '../types';
import TreeElementMesh from './TreeElementMesh';
import '../types'; 

interface Props {
  elements: TreeElement[];
  explosionIntensity: number;
  rotationY?: number;
  isMusicPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const ConstructivistTree: React.FC<Props> = ({ elements, explosionIntensity, rotationY = 0, isMusicPlaying, audioRef }) => {
  return (
    <group rotation={[0, rotationY, 0]}>
      {elements.map((el) => (
        <TreeElementMesh 
          key={el.id} 
          data={el} 
          intensity={explosionIntensity} 
          isMusicPlaying={isMusicPlaying} 
          audioRef={audioRef}
        />
      ))}
      
      {/* Abstract Trunk */}
      <mesh position={[0, -6.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 4]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.85} />
      </mesh>
    </group>
  );
};

export default ConstructivistTree;
