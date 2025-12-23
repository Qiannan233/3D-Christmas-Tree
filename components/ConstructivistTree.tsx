import React from 'react';
import { TreeElement } from '../types';
import TreeElementMesh from './TreeElementMesh';

interface Props {
  elements: TreeElement[];
  explosionIntensity: number;
  rotationY?: number;
}

const ConstructivistTree: React.FC<Props> = ({ elements, explosionIntensity, rotationY = 0 }) => {
  return (
    <group rotation={[0, rotationY, 0]}>
      {elements.map((el) => (
        <TreeElementMesh key={el.id} data={el} intensity={explosionIntensity} />
      ))}
      
      {/* Abstract Trunk - Matte Charcoal look */}
      <mesh position={[0, -6.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 4]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.85} />
      </mesh>
    </group>
  );
};

export default ConstructivistTree;