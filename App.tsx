
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import ConstructivistTree from './components/ConstructivistTree';
import { generateTreeElements } from './utils/math';
import { TreeElement } from './types';
import './types'; // Ensure JSX intrinsic elements augmentation is active
import { 
  SparklesIcon, 
  CameraIcon,
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
    </>
  );
};

const SceneContent: React.FC<{ 
  elements: TreeElement[], 
  explosionIntensity: number, 
  treeRotation: number, 
  isMusicPlaying: boolean, 
  responsiveScale: number,
  audioRef: React.RefObject<HTMLAudioElement>
}> = ({ elements, explosionIntensity, treeRotation, isMusicPlaying, responsiveScale, audioRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((state) => {
    const time = audioRef.current ? audioRef.current.currentTime : state.clock.getElapsedTime();
    const bpm = 120;
    const beat = Math.sin(time * Math.PI * (bpm / 60));
    
    if (isMusicPlaying && groupRef.current) {
      const pulse = Math.max(0, beat) * 0.012;
      groupRef.current.scale.set(responsiveScale + pulse, responsiveScale + pulse, responsiveScale + pulse);
    } else if (groupRef.current) {
      groupRef.current.scale.set(responsiveScale, responsiveScale, responsiveScale);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.4 + (isMusicPlaying ? Math.max(0, beat) * 0.15 : 0);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 35]} fov={35} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={10} maxDistance={70} />
      
      <ambientLight ref={ambientRef} intensity={0.5} />
      <spotLight position={[15, 35, 15]} angle={0.3} penumbra={0.8} intensity={2} castShadow />
      <pointLight position={[-15, 10, -10]} intensity={0.3} color="#ffffff" />
      
      <group ref={groupRef}>
        <ConstructivistTree 
          elements={elements} 
          explosionIntensity={explosionIntensity} 
          rotationY={treeRotation} 
          isMusicPlaying={isMusicPlaying}
          audioRef={audioRef}
        />
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [responsiveScale, setResponsiveScale] = useState(window.innerWidth < 768 ? 0.65 : 1);
  
  // Draggable state
  const [cameraPos, setCameraPos] = useState({ x: 16, y: 0 }); 
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setResponsiveScale(mobile ? 0.65 : 1);
      // Adjust camera initial Y to stay at the bottom left area
      if (cameraPos.y === 0) {
        setCameraPos(prev => ({ ...prev, y: window.innerHeight - (mobile ? 200 : 220) }));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: clientX - cameraPos.x,
      y: clientY - cameraPos.y
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      let newX = clientX - dragOffset.current.x;
      let newY = clientY - dragOffset.current.y;
      
      newX = Math.max(0, Math.min(newX, window.innerWidth - (isMobile ? 96 : 280)));
      newY = Math.max(0, Math.min(newY, window.innerHeight - (isMobile ? 128 : 158)));

      setCameraPos({ x: newX, y: newY });
    };
    const handleEnd = () => { isDragging.current = false; };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isMobile]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsMusicPlaying(true));
    }
  };

  const handleRegenerate = () => setElements(generateTreeElements(100));

  const handleCaptureImage = () => {
    const webglCanvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!webglCanvas) return;

    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Use actual WebGL canvas dimensions for high resolution
    offscreen.width = webglCanvas.width;
    offscreen.height = webglCanvas.height;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    
    // Draw 3D Tree
    ctx.drawImage(webglCanvas, 0, 0);

    const wRatio = offscreen.width / window.innerWidth;
    const hRatio = offscreen.height / window.innerHeight;

    // NOTE: Per user request, we NO LONGER draw the camera preview frame on the captured image.

    const scale = offscreen.width / 1200; 
    const paddingX = 48 * wRatio;
    const paddingY = 48 * hRatio;

    // Draw Text Overlays
    ctx.fillStyle = '#1a1a1a';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Title line 1
    ctx.font = `italic 300 ${Math.round(48 * scale)}px "Cormorant Garamond", serif`;
    ctx.fillText("Rockin' Around", paddingX, paddingY);

    // Title line 2
    ctx.font = `600 ${Math.round(60 * scale)}px "Cormorant Garamond", serif`;
    ctx.fillText("The Christmas Tree", paddingX, paddingY + (52 * scale));

    // Separator
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + (130 * scale));
    ctx.lineTo(paddingX + (220 * scale), paddingY + (130 * scale));
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.stroke();

    // Subtitle
    ctx.font = `400 ${Math.round(11 * scale)}px "Montserrat", sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    if ('letterSpacing' in ctx) (ctx as any).letterSpacing = `${3 * scale}px`;
    ctx.fillText("Digital Sculpture • Constructivist Art", paddingX, paddingY + (145 * scale));

    // Footer
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(10 * scale)}px "Montserrat", sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    if ('letterSpacing' in ctx) (ctx as any).letterSpacing = `${6 * scale}px`;
    ctx.fillText("Powered by Enclave Studio", offscreen.width / 2, offscreen.height - (24 * hRatio));

    // Download link
    const link = document.createElement('a');
    link.download = `christmas-tree-${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png', 1.0);
    link.click();
  };

  useEffect(() => {
    if (!isCameraActive) return;
    let hands: any, faceDetection: any, camera: any;

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
          const thumb = landmarks[4], index = landmarks[8];
          const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
          // Use THREE.MathUtils.lerp safely
          setExplosionIntensity(prev => THREE.MathUtils.lerp(prev, Math.min(Math.max((dist - 0.05) / 0.35, 0), 1), 0.15));
          setTreeRotation(prev => THREE.MathUtils.lerp(prev, -(landmarks[9].x - 0.5) * Math.PI * 2.5, 0.1));
        } else {
          setExplosionIntensity(prev => THREE.MathUtils.lerp(prev, 0, 0.05));
        }
        if (canvasRef.current && results.image) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const canvas = canvasRef.current;
            canvas.width = results.image.width;
            canvas.height = results.image.height;
            ctx.save(); ctx.scale(-1, 1); ctx.translate(-canvas.width, 0);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            if (lastFaceResults?.detections) {
              lastFaceResults.detections.forEach((d: any) => {
                const box = d.boundingBox;
                const emojiSize = Math.max(box.width * canvas.width, box.height * canvas.height) * 1.5;
                ctx.font = `${emojiSize}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🧑‍🎄', box.xCenter * canvas.width, box.yCenter * canvas.height);
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
          }, width: 640, height: 480
        });
        camera.start();
      }
    };
    loadMediaPipe();
    return () => { camera?.stop(); hands?.close(); faceDetection?.close(); };
  }, [isCameraActive]);

  const SubtitleChars = "Digital Sculpture • Constructivist Art".split("");

  return (
    <div className="relative w-full h-full bg-white font-sans text-[#1a1a1a] overflow-hidden select-none">
      {!isMobile && <MagicCursor />}
      <audio ref={audioRef} src={AUDIO_SRC} loop crossOrigin="anonymous" />
      <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"><video ref={videoRef} playsInline muted /></div>

      <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
        <SceneContent 
          elements={elements} explosionIntensity={explosionIntensity} 
          treeRotation={treeRotation} isMusicPlaying={isMusicPlaying} 
          responsiveScale={responsiveScale} audioRef={audioRef}
        />
      </Canvas>

      {/* Header Branding - Responsive Sizes for Desktop */}
      <div className="absolute top-6 md:top-12 lg:top-20 left-6 md:left-12 lg:left-20 pointer-events-none">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif italic font-light tracking-tight mb-1 text-black">Rockin' Around</h2>
        <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-semibold tracking-tighter text-black leading-none">The Christmas Tree</h1>
        <div className="h-px w-20 md:w-32 lg:w-40 bg-black/10 my-3 md:my-6" />
        <div className="flex justify-between w-full max-w-[280px] md:max-w-[450px] lg:max-w-[600px]">
          {SubtitleChars.map((char, idx) => (
            <span key={idx} className="text-[8px] md:text-[10px] lg:text-[12px] font-sans uppercase text-black/40 leading-none">{char === " " ? "\u00A0" : char}</span>
          ))}
        </div>
      </div>

      {/* Music Toggle - Top Right with Rotation */}
      <div className="absolute top-6 sm:top-10 right-6 sm:right-10 z-[100]">
        <button onClick={toggleMusic} className={`p-3.5 rounded-full transition-all duration-500 shadow-lg glass-ui flex items-center justify-center ${isMusicPlaying ? 'bg-black text-white scale-110' : 'text-black/30 hover:text-black hover:bg-white'}`}>
          <MusicalNoteIcon className={`w-6 h-6 md:w-8 md:h-8 ${isMusicPlaying ? 'animate-music-rotate' : ''}`} />
        </button>
      </div>

      {/* DRAGGABLE CAMERA PREVIEW */}
      <div 
        onMouseDown={handleDragStart} onTouchStart={handleDragStart}
        className={`fixed cursor-grab active:cursor-grabbing bg-white rounded-xl overflow-hidden border border-black/5 shadow-2xl z-[60] transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          left: `${cameraPos.x}px`, top: `${cameraPos.y}px`,
          width: isMobile ? '96px' : '220px', height: isMobile ? '128px' : '150px'
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full object-contain bg-neutral-100" />
        <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-1 opacity-40 pointer-events-none">
           <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
           <span className="text-[7px] font-bold uppercase tracking-widest text-black">LIVE</span>
        </div>
      </div>

      {/* COMPACT CENTERED NAVIGATION */}
      <div 
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto"
        style={{ width: isMobile ? '70vw' : (window.innerWidth < 1200 ? '45vw' : '32vw'), maxWidth: '600px' }}
      >
        <div className="flex flex-row items-center glass-ui px-3 sm:px-6 py-2 sm:py-3.5 rounded-full shadow-xl border border-black/[0.03]">
          <button 
            onClick={() => setIsCameraActive(!isCameraActive)} 
            className={`p-2.5 sm:p-3 rounded-full transition-all ${isCameraActive ? 'bg-black text-white' : 'text-black/30 hover:text-black hover:bg-black/5'}`}
          >
            <HandRaisedIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </button>
          
          <div className="flex-1 flex items-center px-4 sm:px-8 border-x border-black/5 h-full">
            <input 
              type="range" min="0" max="1" step="0.001" value={explosionIntensity} 
              onChange={(e) => setExplosionIntensity(parseFloat(e.target.value))} 
              className="w-full h-[4px] bg-black/10 appearance-none cursor-pointer accent-black rounded-full outline-none" 
            />
          </div>

          <div className="flex space-x-1.5 sm:space-x-3 ml-2 sm:ml-4">
            <button onClick={handleRegenerate} className="p-2.5 sm:p-3 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-all">
              <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={handleCaptureImage} className="p-2.5 sm:p-3 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-all">
              <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-1.5 sm:bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <p className="text-[6px] sm:text-[9px] font-sans uppercase tracking-[0.5em] text-black/15 font-bold">POWERED BY ENCLAVE STUDIO</p>
      </div>
    </div>
  );
};

export default App;
