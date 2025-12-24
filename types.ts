
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';

// Augment the global JSX namespace to include Three.js elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Support for modern React 18+ environments which often look for JSX under the React namespace
declare module 'react' {
  interface IntrinsicElements extends ThreeElements {}
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export enum ShapeType {
  RING = 'RING',
  DISK = 'DISK',
  SPHERE = 'SPHERE',
  TRIANGLE = 'TRIANGLE',
  BOX = 'BOX',
  CYLINDER = 'CYLINDER',
  CONE = 'CONE'
}

export enum MaterialType {
  DIFFUSE = 'DIFFUSE',
  GLASS = 'GLASS',
  METAL = 'METAL',
  WIREFRAME = 'WIREFRAME',
  EMISSIVE = 'EMISSIVE'
}

export interface TreeElement {
  id: string;
  type: ShapeType;
  materialType: MaterialType;
  color: string;
  size: [number, number, number];
  rotation: [number, number, number];
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
}

export interface HandData {
  isOpen: boolean;
  pinchDistance: number; // 0 to 1
  palmPos: { x: number, y: number };
}
