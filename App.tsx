import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import ConstructivistTree from './components/ConstructivistTree';
import { generateTreeElements } from './utils/math';
import { TreeElement } from './types';
import { 
  ArrowPathIcon, 
  PhotoIcon,
  HandRaisedIcon,
  SpeakerXMarkIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';

const HANDS_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/hands";
const FACE_DETECTION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection";
const CAMERA_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils";

const AUDIO_SRC = "https://www.mfiles.co.uk/mp3-downloads/shepherds-shake-off-your-drowsy-sleep.mp3";

const MagicCursor: React.FC = () => {
  const cursorRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const [trail, setTrail] = useState<{ x: number; y: number; opacity: number; scale: number; id: number }[]>([]);
  const trailRef = useRef<{ x: number; y: number; opacity: number; scale: number; id: number }[]>([]);
  const displayPos = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const requestRef = useRef<number>(0);
  const counterRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    const animate = () => {
      const lerpFactor = 0.15;
      displayPos.current.x += (cursorRef.current.x - displayPos.current.x) * lerpFactor;
      displayPos.current.y += (cursorRef.current.y - displayPos.current.y) * lerpFactor;

      const dx = Math.abs(cursorRef.current.x - displayPos.current.x);
      const dy = Math.abs(cursorRef.current.y - displayPos.current.y);
      
      if (dx > 0.5 || dy > 0.5) {
        counterRef.current++;
        const newPoint = { 
          x: displayPos.current.x + (Math.random() - 0.5) * 10, 
          y: displayPos.current.y + (Math.random() - 0.5) * 10, 
          opacity: 0.9, 
          scale: 0.6 + Math.random() * 1.0,
          id: counterRef.current
        };
        trailRef.current = [newPoint, ...trailRef.current.slice(0, 24)];
      }

      trailRef.current = trailRef.current.map((p) => ({
        ...p,
        opacity: p.opacity * 0.9,
        scale: p.scale * 0.96,
        y: p.y + 0.8 
      })).filter(p => p.opacity > 0.05);

      setTrail([...trailRef.current]);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <>
      {trail.map((p) => (
        <div 
          key={p.id}
          className="fixed pointer-events-none rounded-full z-[9998]"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${14 * p.scale}px`,
            height: `${14 * p.scale}px`,
            background: `radial-gradient(circle, #004225 0%, rgba(0, 66, 37, 0) 80%)`,
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      
      <div 
        className="fixed pointer-events-none rounded-full z-[9999] transform -translate-x-1/2 -translate-y-1/2" 
        style={{ 
          left: `${displayPos.current.x}px`, 
          top: `${displayPos.current.y}px`,
          width: '42px',
          height: '42px',
          background: 'radial-gradient(circle, rgba(57, 255, 20, 0.6) 0%, rgba(57, 255, 20, 0) 70%)',
          boxShadow: '0 0 25px rgba(57, 255, 20, 0.5)'
        }} 
      />
      
      <div 
        className="fixed pointer-events-none rounded-full z-[10000] transform -translate-x-1/2 -translate-y-1/2 border border-white/20" 
        style={{ 
          left: `${displayPos.current.x}px`, 
          top: `${displayPos.current.y}px`,
          width: '10px',
          height: '10px',
          backgroundColor: '#004225',
          boxShadow: '0 0 10px rgba(0, 66, 37, 0.8)'
        }} 
      />
    </>
  );
};

const SceneContent: React.FC<{ elements: TreeElement[], explosionIntensity: number, treeRotation: number, isMusicPlaying: boolean, responsiveScale: number }> = ({ elements, explosionIntensity, treeRotation, isMusicPlaying, responsiveScale }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const beat = Math.sin(time * Math.PI * 2);
    
    if (isMusicPlaying && groupRef.current) {
      const pulse = Math.max(0, beat) * 0.015;
      groupRef.current.scale.set(responsiveScale + pulse, responsiveScale + pulse, responsiveScale + pulse);
    } else if (groupRef.current) {
      groupRef.current.scale.set(responsiveScale, responsiveScale, responsiveScale);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.4 + (isMusicPlaying ? Math.max(0, beat) * 0.2 : 0);
    }

    if (spotRef.current) {
      spotRef.current.intensity = 1.8 + (isMusicPlaying ? Math.abs(beat) * 1.2 : 0);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 35]} fov={35} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={10} maxDistance={70} />
      
      <ambientLight ref={ambientRef} intensity={0.5} />
      <spotLight ref={spotRef} position={[15, 35, 15]} angle={0.3} penumbra={0.8} intensity={2} castShadow />
      <pointLight position={[-15, 10, -10]} intensity={0.3} color="#ffffff" />
      
      <group ref={groupRef}>
        <ConstructivistTree elements={elements} explosionIntensity={explosionIntensity} rotationY={treeRotation} />
      </group>
      
      <ContactShadows position={[0, -6.5 * responsiveScale, 0]} opacity={0.12} scale={60 * responsiveScale} blur={3.5} far={10} />
      <Environment preset="studio" />
    </>
  );
};

const App: React.FC = () => {
  const [elements, setElements] = useState<TreeElement[]>(() => generateTreeElements(85));
  const [explosionIntensity, setExplosionIntensity] = useState(0);
  const [treeRotation, setTreeRotation] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [responsiveScale, setResponsiveScale] = useState(window.innerWidth < 768 ? 0.65 : 1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setResponsiveScale(window.innerWidth < 768 ? 0.65 : 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsMusicPlaying(true);
          setAudioError(false);
        })
        .catch(() => setAudioError(true));
    }
  };

  const handleRegenerate = () => {
    setElements(generateTreeElements(100));
  };

  const handleCaptureImage = () => {
    const webglCanvas = document.querySelector('canvas');
    if (!webglCanvas) return;

    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    offscreen.width = webglCanvas.width;
    offscreen.height = webglCanvas.height;

    // 1. Draw Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    // 2. Draw 3D Render
    ctx.drawImage(webglCanvas, 0, 0);

    // 3. Draw Title Overlay
    const margin = offscreen.width * 0.05;
    
    // Rockin' Around
    ctx.fillStyle = '#000000';
    ctx.font = `italic 300 ${offscreen.width * 0.04}px "Cormorant Garamond", serif`;
    ctx.textBaseline = 'top';
    ctx.fillText("Rockin' Around", margin, margin);

    // The Christmas Tree (Anchor width)
    const mainTitle = "The Christmas Tree";
    const mainTitleFontSize = offscreen.width * 0.055;
    ctx.font = `600 ${mainTitleFontSize}px "Cormorant Garamond", serif`;
    const mainTitleWidth = ctx.measureText(mainTitle).width;
    const mainTitleY = margin + (offscreen.width * 0.05);
    ctx.fillText(mainTitle, margin, mainTitleY);

    // Separator line (matching width ratio)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(margin, mainTitleY + (offscreen.width * 0.075), mainTitleWidth * 0.2, 2);

    // Subtitle Line: Scaled to match mainTitleWidth
    const subtitle = "DIGITAL SCULPTURE • SPATIAL CONSTRUCT";
    const subtitleFontSize = offscreen.width * 0.012;
    ctx.font = `400 ${subtitleFontSize}px "Montserrat", sans-serif`;
    
    // Distribute letters to match mainTitleWidth
    const chars = subtitle.split('');
    const charWidths = chars.map(c => ctx.measureText(c).width);
    const totalCharWidth = charWidths.reduce((a, b) => a + b, 0);
    const availableSpace = mainTitleWidth - totalCharWidth;
    const spacing = availableSpace / (chars.length - 1);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    let xOffset = margin;
    chars.forEach((char) => {
      ctx.fillText(char, xOffset, mainTitleY + (offscreen.width * 0.09));
      xOffset += ctx.measureText(char).width + spacing;
    });

    // Footer Attribution
    ctx.textAlign = 'right';
    ctx.font = `italic 300 ${offscreen.width * 0.025}px "Cormorant Garamond", serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillText("Volume, Form & Magic", offscreen.width - margin, offscreen.height - margin - (offscreen.width * 0.025));
    
    ctx.font = `400 ${offscreen.width * 0.008}px "Montserrat", sans-serif`;
    ctx.letterSpacing = '1em';
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillText("EXPERIMENTAL HOLIDAY ART", offscreen.width - margin, offscreen.height - margin);

    const link = document.createElement('a');
    link.download = `rockin-tree-poster-${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (!isCameraActive) return;

    let hands: any;
    let faceDetection: any;
    let camera: any;

    const loadMediaPipe = async () => {
      if (!(window as any).Hands) {
        const handsScript = document.createElement('script');
        handsScript.src = `${HANDS_CDN}/hands.js`;
        document.head.appendChild(handsScript);
        
        const faceScript = document.createElement('script');
        faceScript.src = `${FACE_DETECTION_CDN}/face_detection.js`;
        document.head.appendChild(faceScript);

        const cameraScript = document.createElement('script');
        cameraScript.src = `${CAMERA_CDN}/camera_utils.js`;
        document.head.appendChild(cameraScript);
        await new Promise(r => setTimeout(r, 1500)); 
      }

      if (!(window as any).Hands || !(window as any).FaceDetection) return;

      hands = new (window as any).Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
      
      faceDetection = new (window as any).FaceDetection({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${f}` });
      faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.88 });

      let lastFaceResults: any = null;
      faceDetection.onResults((r: any) => { lastFaceResults = r; });

      hands.onResults((results: any) => {
        if (results.multiHandLandmarks?.[0]) {
          const landmarks = results.multiHandLandmarks[0];
          
          const palmBase = landmarks[0];
          const fingerTips = [8, 12, 16, 20];
          const fingerJoints = [5, 9, 13, 17];
          
          let closedFingersCount = 0;
          fingerTips.forEach((tipIdx, i) => {
            const tip = landmarks[tipIdx];
            const joint = landmarks[fingerJoints[i]];
            const distTip = Math.sqrt(Math.pow(tip.x - palmBase.x, 2) + Math.pow(tip.y - palmBase.y, 2));
            const distJoint = Math.sqrt(Math.pow(joint.x - palmBase.x, 2) + Math.pow(joint.y - palmBase.y, 2));
            if (distTip < distJoint * 1.15) closedFingersCount++;
          });
          
          if (closedFingersCount >= 3) {
            setExplosionIntensity(prev => THREE.MathUtils.lerp(prev, 0, 0.25));
          } else {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
            const targetIntensity = Math.min(Math.max((dist - 0.05) / 0.35, 0), 1);
            setExplosionIntensity(prev => THREE.MathUtils.lerp(prev, targetIntensity, 0.15));
          }

          const targetRotation = -(landmarks[9].x - 0.5) * Math.PI * 2.5;
          setTreeRotation(prev => THREE.MathUtils.lerp(prev, targetRotation, 0.1));
        } else {
          setExplosionIntensity(prev => THREE.MathUtils.lerp(prev, 0, 0.05));
        }

        if (canvasRef.current && results.image) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const canvas = canvasRef.current;
            canvas.width = results.image.width;
            canvas.height = results.image.height;
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            
            if (lastFaceResults?.detections) {
              lastFaceResults.detections.forEach((d: any) => {
                const box = d.boundingBox;
                const score = (d.score && Array.isArray(d.score)) ? d.score[0] : (d.score || 0);
                
                const aspect = box.width / box.height;
                const isLikelyFace = score > 0.88 && box.width > 0.08 && aspect > 0.6 && aspect < 1.6;

                if (isLikelyFace) {
                  const emojiSize = Math.max(box.width * canvas.width, box.height * canvas.height) * 1.5;
                  ctx.font = `${emojiSize}px serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('🧑‍🎄', box.xCenter * canvas.width, box.yCenter * canvas.height);
                }
              });
            }
            ctx.restore();
          }
        }
      });

      if (videoRef.current) {
        camera = new (window as any).Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceDetection.send({ image: videoRef.current });
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
      }
    };

    loadMediaPipe();
    return () => {
      camera?.stop();
      hands?.close();
      faceDetection?.close();
    };
  }, [isCameraActive]);

  const SubtitleChars = "DIGITAL SCULPTURE • SPATIAL CONSTRUCT".split("");

  return (
    <div className="relative w-full h-full bg-white font-sans text-[#1a1a1a] overflow-hidden select-none">
      <MagicCursor />
      <audio ref={audioRef} src={AUDIO_SRC} loop crossOrigin="anonymous" onError={() => setAudioError(true)} />
      <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
        <video ref={videoRef} playsInline muted />
      </div>

      <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
        <SceneContent 
          elements={elements} 
          explosionIntensity={explosionIntensity} 
          treeRotation={treeRotation} 
          isMusicPlaying={isMusicPlaying} 
          responsiveScale={responsiveScale}
        />
      </Canvas>

      <div className={`absolute bottom-8 left-8 w-40 sm:w-56 h-32 sm:h-40 bg-white rounded-xl overflow-hidden border border-black/5 shadow-2xl transition-all ${isCameraActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
        <canvas ref={canvasRef} className="w-full h-full object-contain bg-neutral-50" />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[7px] sm:text-[9px] text-white uppercase tracking-widest font-bold font-sans">Live Tracking</div>
      </div>

      <div className="absolute top-6 sm:top-12 left-6 sm:left-12">
        <div className="flex flex-col">
          <h2 className="text-3xl sm:text-5xl font-serif italic font-light tracking-tight text-black mb-1 sm:mb-2">Rockin' Around</h2>
          <div className="relative w-fit">
            <h1 className="text-4xl sm:text-6xl font-serif font-semibold tracking-tighter text-black leading-none whitespace-nowrap">
              The Christmas Tree
            </h1>
            <div className="h-px w-1/4 bg-black/10 my-3 sm:my-4" />
            <div className="flex justify-between w-full">
              {SubtitleChars.map((char, idx) => (
                <span key={idx} className="text-[7px] sm:text-[10px] font-sans uppercase text-black/40 leading-none">
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Music Button with custom glass styles and animation */}
      <div className="absolute top-6 sm:top-12 right-6 sm:right-12 z-50">
        <button 
          onClick={toggleMusic} 
          className={`
            group relative p-3 sm:p-4 rounded-full transition-all duration-500 shadow-xl overflow-hidden glass-ui
            ${isMusicPlaying ? 'bg-black text-white scale-110 animate-slow-rotate ring-2 ring-black/5' : 'bg-white/70 text-black/40 hover:text-black hover:bg-white'}
          `}
          title={isMusicPlaying ? "Pause Music" : "Play Music"}
        >
          <MusicalNoteIcon className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 ${isMusicPlaying ? 'scale-110' : 'scale-100'}`} />
          
          {/* Subtle glow for playing state */}
          {isMusicPlaying && (
            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
          )}
        </button>
      </div>

      <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 glass-ui px-4 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-2xl shadow-sm border border-black/[0.03] scale-90 sm:scale-100">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <button onClick={() => setIsCameraActive(!isCameraActive)} className={`p-2 sm:p-3 rounded-xl transition-all ${isCameraActive ? 'bg-black text-white' : 'text-black/40 hover:text-black hover:bg-black/5'}`}>
            <HandRaisedIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
          </button>
          <div className="w-px h-6 sm:h-10 bg-black/5" />
          <div className="flex flex-col items-center px-1 sm:px-4">
            <input type="range" min="0" max="1" step="0.001" value={explosionIntensity} onChange={(e) => setExplosionIntensity(parseFloat(e.target.value))} className="w-24 sm:w-32 h-[1px] bg-black/10 appearance-none cursor-pointer accent-black" />
            <span className="text-[7px] sm:text-[8px] font-sans uppercase text-black/20 tracking-[0.2em] mt-2 sm:mt-3">Structure</span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 bg-black/5" />
        <div className="sm:hidden w-full h-px bg-black/5" />

        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex space-x-1 sm:space-x-2">
            <button onClick={handleRegenerate} className="p-2 sm:p-3 text-black/40 hover:text-black hover:bg-black/5 rounded-xl transition-all" title="Regenerate">
              <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={handleCaptureImage} className="p-2 sm:p-3 text-black/40 hover:text-black hover:bg-black/5 rounded-xl transition-all" title="Capture">
              <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 sm:bottom-12 right-6 sm:right-12 text-right pointer-events-none hidden sm:block">
        <p className="font-serif text-3xl font-light italic leading-none opacity-20">Volume, Form & Magic</p>
        <p className="font-sans text-[8px] uppercase tracking-[1em] opacity-10 mt-2">Experimental Holiday Art</p>
      </div>
    </div>
  );
};

export default App;