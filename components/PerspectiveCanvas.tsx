
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Layer } from '../types';

interface PerspectiveCanvasProps {
  image: HTMLImageElement;
  layers: Layer[];
  activeLayerId: string | null;
  setActiveLayerId: (id: string | null) => void;
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  addVanishingPoint: (point?: Point) => void;
  deleteLayer: (id: string) => void;
  saveToHistory: () => void;
  workspaceZoom: number;
  setWorkspaceZoom: (zoom: number) => void;
  enableSnapping: boolean;
  isGuideMode: boolean;
  setIsGuideMode: (val: boolean) => void;
}

interface GuideLine {
  start: { x: number, y: number };
  end: { x: number, y: number };
}

const PerspectiveCanvas: React.FC<PerspectiveCanvasProps> = ({
  image,
  layers,
  activeLayerId,
  setActiveLayerId,
  setLayers,
  addVanishingPoint,
  saveToHistory,
  workspaceZoom,
  setWorkspaceZoom,
  enableSnapping,
  isGuideMode,
  setIsGuideMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dragState, setDragState] = useState<{
    layerId: string;
    startMouse: { x: number, y: number };
    originalPoint: Point;
  } | null>(null);

  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
  const [tempGuide, setTempGuide] = useState<GuideLine | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    const centerX = canvas.width / 2 + pan.x;
    const centerY = canvas.height / 2 + pan.y;
    const imgW = image.naturalWidth * workspaceZoom;
    const imgH = image.naturalHeight * workspaceZoom;
    const imgX = centerX - imgW / 2;
    const imgY = centerY - imgH / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製圖片
    ctx.save();
    ctx.globalAlpha = isGuideMode ? 0.4 : 0.6;
    ctx.drawImage(image, imgX, imgY, imgW, imgH);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(imgX, imgY, imgW, imgH);
    ctx.restore();

    // 繪製各圖層
    layers.forEach(layer => {
      if (!layer.visible) return;
      const isActive = layer.id === activeLayerId;
      const isHovered = hoveredLayerId === layer.id;
      
      ctx.save();
      ctx.strokeStyle = layer.color;
      let baseAlpha = isActive ? 1.0 : (isHovered ? 0.7 : 0.3);
      if (isGuideMode) baseAlpha *= 0.2; 
      ctx.globalAlpha = baseAlpha;
      ctx.lineWidth = (isActive || isHovered) ? layer.width + 1 : layer.width;

      if (layer.type === 'perspective') {
        const totalSegments = layer.density * 4;
        const angleStep = 360 / totalSegments;
        layer.points.forEach((vp) => {
          const sx = centerX + vp.x * workspaceZoom;
          const sy = centerY + vp.y * workspaceZoom;
          
          ctx.beginPath();
          for (let i = 0; i < totalSegments; i++) {
            const rad = (i * angleStep * Math.PI) / 180;
            const length = Math.max(canvas.width, canvas.height) * 10;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(rad) * length, sy + Math.sin(rad) * length);
          }
          ctx.stroke();

          // 消失點標記
          if (!isGuideMode) {
            ctx.save();
            ctx.globalAlpha = isActive ? 1.0 : 0.7;
            ctx.fillStyle = layer.color;
            ctx.beginPath();
            ctx.arc(sx, sy, isActive ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (layer.locked) {
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
        });
      } else {
        const dx = imgW / layer.density;
        const dy = imgH / (layer.densityY || 1);
        for (let i = 0; i <= layer.density; i++) {
          const x = imgX + i * dx;
          ctx.beginPath(); ctx.moveTo(x, imgY); ctx.lineTo(x, imgY + imgH); ctx.stroke();
        }
        for (let j = 0; j <= (layer.densityY || 1); j++) {
          const y = imgY + j * dy;
          ctx.beginPath(); ctx.moveTo(imgX, y); ctx.lineTo(imgX + imgW, y); ctx.stroke();
        }
      }
      ctx.restore();
    });

    // 偵測模式引導線
    if (isGuideMode) {
      ctx.save(); ctx.setLineDash([10, 5]); ctx.lineWidth = 2; ctx.strokeStyle = '#fbbf24'; 
      [...guideLines, tempGuide].filter(Boolean).forEach((line) => {
        if (!line) return;
        ctx.beginPath(); ctx.moveTo(line.start.x, line.start.y); ctx.lineTo(line.end.x, line.end.y); ctx.stroke();
      });
      ctx.restore();
    }
  }, [image, layers, activeLayerId, workspaceZoom, pan, hoveredLayerId, isGuideMode, guideLines, tempGuide]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const checkCollision = useCallback((mouseX: number, mouseY: number, centerX: number, centerY: number) => {
    const imgW = image.naturalWidth * workspaceZoom;
    const imgH = image.naturalHeight * workspaceZoom;
    const imgX = centerX - imgW / 2;
    const imgY = centerY - imgH / 2;

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.locked) continue;
      
      if (layer.type === 'perspective') {
        for (const vp of layer.points) {
          const sx = centerX + vp.x * workspaceZoom;
          const sy = centerY + vp.y * workspaceZoom;
          const distToPoint = Math.sqrt((mouseX - sx)**2 + (mouseY - sy)**2);
          if (distToPoint < 15) return { id: layer.id, type: 'point' as const };
        }
      }
    }
    return null;
  }, [layers, workspaceZoom, image]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2 + pan.x;
    const cy = canvas.height / 2 + pan.y;

    if (isGuideMode) {
      setTempGuide({ start: { x: mx, y: my }, end: { x: mx, y: my } });
      return;
    }

    if (e.button === 0 && e.altKey) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    const hit = checkCollision(mx, my, cx, cy);
    if (hit) {
      setActiveLayerId(hit.id);
      const targetLayer = layers.find(l => l.id === hit.id)!;
      if (!targetLayer.locked && targetLayer.type === 'perspective') {
        saveToHistory();
        setDragState({ layerId: hit.id, startMouse: { x: mx, y: my }, originalPoint: { ...targetLayer.points[0] } });
      }
    } else {
      // 點擊空白處：新增一個消失點
      const relX = (mx - cx) / workspaceZoom;
      const relY = (my - cy) / workspaceZoom;
      addVanishingPoint({ x: relX, y: relY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isGuideMode && tempGuide) {
      setTempGuide({ ...tempGuide, end: { x: mx, y: my } });
      return;
    }

    if (!dragState && !isPanning) {
      const cx = canvas.width / 2 + pan.x;
      const cy = canvas.height / 2 + pan.y;
      const hit = checkCollision(mx, my, cx, cy);
      setHoveredLayerId(hit ? hit.id : null);
    }

    if (dragState) {
      const dx = (mx - dragState.startMouse.x) / workspaceZoom;
      const dy = (my - dragState.startMouse.y) / workspaceZoom;
      setLayers(prev => prev.map(l => l.id === dragState.layerId ? { ...l, points: [{ x: dragState.originalPoint.x + dx, y: dragState.originalPoint.y + dy }] } : l));
    } else if (isPanning) {
      setPan(prev => ({ x: prev.x + (e.clientX - lastMousePos.x), y: prev.y + (e.clientY - lastMousePos.y) }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isGuideMode && tempGuide) {
      setGuideLines(prev => [...prev, tempGuide!]);
      setTempGuide(null);
      return;
    }
    setDragState(null); 
    setIsPanning(false);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#020617] relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const zoomSpeed = 0.0015;
          const newZoom = Math.min(Math.max(workspaceZoom - e.deltaY * zoomSpeed, 0.05), 8);
          setWorkspaceZoom(newZoom);
        }}
        className="touch-none"
        style={{ cursor: isGuideMode ? 'crosshair' : (isPanning || dragState ? 'grabbing' : (hoveredLayerId ? 'pointer' : 'crosshair')) }}
      />
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 text-[11px] text-slate-400 font-mono tracking-wider shadow-2xl flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          ZOOM: {Math.round(workspaceZoom * 100)}%
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { setPan({x:0, y:0}); setWorkspaceZoom(0.6); }} className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-2xl transition-all shadow-2xl active:scale-90 border border-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerspectiveCanvas;
