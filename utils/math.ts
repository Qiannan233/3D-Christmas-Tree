
import * as THREE from 'three';
import { ShapeType, TreeElement, MaterialType } from '../types';

const COLOR_PALETTE = [
  '#004225', // 深墨绿
  '#FF4500', // 橙红
  '#C0C0C0', // 银灰色
  '#FFFF00', // 明黄
  '#9DB7F1', // 冰川蓝
  '#DAB1DA', // 淡紫粉
  '#FF4D94', // 鲜艳粉
  '#0055FF', // 克莱因蓝
  '#40E0D0', // 薄荷绿
  '#8B0000', // 酒红色
  '#D4AF37', // 香槟金
  '#00FFFF', // 亮青色
  '#000000', // 纯黑 (Black)
  '#FFFFFF', // 纯白 (White)
  '#333333', // 深灰 (Dark Grey)
  '#808080', // 中灰 (Grey)
  '#E5E5E5', // 浅灰 (Light Grey)
];

export const generateTreeElements = (count: number): TreeElement[] => {
  const elements: TreeElement[] = [];
  
  const allowedShapes = [
    ShapeType.RING,
    ShapeType.DISK,
    ShapeType.SPHERE,
    ShapeType.TRIANGLE,
    ShapeType.BOX,
    ShapeType.CYLINDER,
    ShapeType.CONE
  ];

  // Increase diversity by allowing more colors in one tree
  const selectedColorsCount = 4 + Math.floor(Math.random() * 3);
  const selectedColors = [...COLOR_PALETTE]
    .sort(() => Math.random() - 0.5)
    .slice(0, selectedColorsCount);

  const TREE_HEIGHT = 16;
  const BASE_WIDTH = 6.0;

  const createElement = (heightTier: 'top' | 'middle' | 'bottom', index: number): TreeElement => {
    const id = `el-${index}-${Math.random().toString(36).substr(2, 9)}`;
    
    let normalizedHeight: number;
    let baseScale: number;

    if (heightTier === 'bottom') {
      normalizedHeight = 0.6 + Math.random() * 0.4;
      baseScale = 3.0 + Math.random() * 1.5;
    } else if (heightTier === 'middle') {
      normalizedHeight = 0.25 + Math.random() * 0.35;
      baseScale = 1.6 + Math.random() * 1.0;
    } else {
      normalizedHeight = 0.02 + Math.random() * 0.23;
      baseScale = 0.6 + Math.random() * 0.6;
    }

    const profileCurve = Math.pow(normalizedHeight, 0.85);
    const currentMaxRadius = profileCurve * BASE_WIDTH;
    const r = Math.random() * currentMaxRadius;
    const angle = Math.random() * Math.PI * 2;
    
    const height = (1 - normalizedHeight) * TREE_HEIGHT;
    const treePos = new THREE.Vector3(
      Math.cos(angle) * r,
      height - (TREE_HEIGHT / 2), 
      Math.sin(angle) * r
    );

    const scatterAngle = Math.random() * Math.PI * 2;
    const scatterDist = 30 + Math.random() * 15;
    const scatterPos = new THREE.Vector3(
      Math.cos(scatterAngle) * scatterDist,
      (Math.random() - 0.5) * 40,
      Math.sin(scatterAngle) * scatterDist
    );

    const type = allowedShapes[Math.floor(Math.random() * allowedShapes.length)];
    const rand = 0.8 + Math.random() * 0.4;
    
    let size: [number, number, number] = [
      baseScale * rand,
      baseScale * rand,
      baseScale * rand
    ];

    if (type === ShapeType.BOX || type === ShapeType.CYLINDER) {
      const longAxis = Math.floor(Math.random() * 3);
      size[longAxis] *= (1.8 + Math.random() * 1.2); 
      const thickness = 0.04 + Math.random() * 0.06;
      size[(longAxis + 1) % 3] *= thickness;
      size[(longAxis + 2) % 3] *= thickness;
    } else if (type === ShapeType.DISK) {
      size[1] *= 0.05;
    } else if (type === ShapeType.RING) {
      size[1] *= 0.04;
    }

    const color = selectedColors[Math.floor(Math.random() * selectedColors.length)];

    return {
      id,
      type,
      materialType: MaterialType.DIFFUSE,
      color,
      size,
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ],
      treePos,
      scatterPos
    };
  };

  const bottomCount = Math.floor(count * 0.60);
  const middleCount = Math.floor(count * 0.25);
  const topCount = count - bottomCount - middleCount;

  for (let i = 0; i < bottomCount; i++) elements.push(createElement('bottom', i));
  for (let i = 0; i < middleCount; i++) elements.push(createElement('middle', i + bottomCount));
  for (let i = 0; i < topCount; i++) elements.push(createElement('top', i + bottomCount + middleCount));

  elements.forEach((el) => {
    const roll = Math.random();
    // Material distribution
    if (roll < 0.35) el.materialType = MaterialType.DIFFUSE;
    else if (roll < 0.80) el.materialType = MaterialType.GLASS; 
    else if (roll < 0.95) el.materialType = MaterialType.METAL; 
    else el.materialType = MaterialType.WIREFRAME;
  });

  return elements;
};
