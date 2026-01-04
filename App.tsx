import React, { useState, useCallback, useEffect } from 'react';
import { Point, Layer } from './types';
import ControlPanel from './components/ControlPanel';
import PerspectiveCanvas from './components/PerspectiveCanvas';
import Header from './components/Header';

const PRESET_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const MAX_HISTORY = 50;

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [history, setHistory] = useState<Layer[][]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [workspaceZoom, setWorkspaceZoom] = useState<number>(0.6); 
  const [enableSnapping, setEnableSnapping] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isGuideMode, setIsGuideMode] = useState(false);

  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(layers))];
      if (newHistory.length > MAX_HISTORY) return newHistory.slice(1);
      return newHistory;
    });
  }, [layers]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setHistory(prev => {
      const lastState = prev[prev.length - 1];
      setLayers(lastState);
      return prev.slice(0, -1);
    });
  }, [history]);

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      if (layers.length === 0) {
        const firstId = `vp-${Date.now()}`;
        setLayers([{
          id: firstId,
          name: "消失點 1",
          type: 'perspective',
          points: [{ x: 0, y: 0 }],
          visible: true,
          locked: false,
          color: PRESET_COLORS[0],
          density: 12,
          width: 1
        }]);
        setActiveLayerId(firstId);
      }
    };
    img.src = src;
  }, [layers.length]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) loadImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [loadImage]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === 'z';
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && isZ) {
        e.preventDefault();
        undo();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) loadImage(event.target.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [undo, loadImage]);

  const addLayer = useCallback((type: 'perspective' | 'ortho-grid', initialPoint?: Point) => {
    if (!image) return;
    saveToHistory();
    const newId = `vp-${Date.now()}`;
    const colorIndex = layers.length % PRESET_COLORS.length;
    const newLayer: Layer = {
      id: newId,
      name: type === 'perspective' ? `消失點 ${layers.length + 1}` : `參考網格 ${layers.length + 1}`,
      type,
      points: type === 'perspective' ? [initialPoint || { x: 0, y: 0 }] : [],
      visible: true,
      locked: false,
      color: PRESET_COLORS[colorIndex],
      density: type === 'perspective' ? 12 : 10,
      densityY: type === 'ortho-grid' ? 10 : undefined,
      width: 1
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newId);
  }, [image, layers, saveToHistory]);

  const handleExport = useCallback(async (separateLayers = false) => {
    if (!image) return;
    setIsExporting(true);
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = image.naturalWidth;
    exportCanvas.height = image.naturalHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const renderLayerToCanvas = (layer: Layer) => {
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = layer.width;
      ctx.lineCap = 'round';
      const centerX = exportCanvas.width / 2;
      const centerY = exportCanvas.height / 2;

      if (layer.type === 'perspective') {
        const totalSegments = layer.density * 4;
        const angleStep = 360 / totalSegments;
        layer.points.forEach((vp) => {
          const realX = centerX + vp.x;
          const realY = centerY + vp.y;
          ctx.beginPath();
          for (let i = 0; i < totalSegments; i++) {
            const rad = (i * angleStep * Math.PI) / 180;
            const length = Math.max(exportCanvas.width, exportCanvas.height) * 20;
            ctx.moveTo(realX, realY);
            ctx.lineTo(realX + Math.cos(rad) * length, realY + Math.sin(rad) * length);
          }
          ctx.stroke();
          
          if (realX >= 0 && realX <= exportCanvas.width && realY >= 0 && realY <= exportCanvas.height) {
            ctx.fillStyle = layer.color;
            ctx.beginPath();
            ctx.arc(realX, realY, layer.width * 3 + 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      } else {
        const dx = exportCanvas.width / (layer.density || 1);
        const dy = exportCanvas.height / (layer.densityY || 1);
        
        for (let i = 0; i <= (layer.density || 0); i++) {
          const x = i * dx;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, exportCanvas.height); ctx.stroke();
        }
        for (let j = 0; j <= (layer.densityY || 0); j++) {
          const y = j * dy;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(exportCanvas.width, y); ctx.stroke();
        }
      }
    };

    const downloadCanvas = (filename: string) => {
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const visibleLayers = layers.filter(l => l.visible);

    if (separateLayers) {
      for (let i = 0; i < visibleLayers.length; i++) {
        ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
        renderLayerToCanvas(visibleLayers[i]);
        downloadCanvas(`layer_${i + 1}_${visibleLayers[i].name}.png`);
        await new Promise(r => setTimeout(r, 250));
      }
    } else {
      ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      visibleLayers.forEach(l => renderLayerToCanvas(l));
      downloadCanvas(`perspective_merged_${Date.now()}.png`);
    }
    setIsExporting(false);
  }, [image, layers]);

  const saveProject = useCallback(() => {
    const projectData = { version: "1.1", layers, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `perspective_project_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [layers]);

  const loadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.layers) {
            saveToHistory();
            setLayers(data.layers);
            setActiveLayerId(data.layers[0]?.id || null);
          }
        } catch (err) { alert("讀取專案失敗"); }
      };
      reader.readAsText(file);
    }
  }, [saveToHistory]);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-200">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <ControlPanel 
          layers={layers}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          addVanishingPoint={() => addLayer('perspective')}
          addGridLayer={() => addLayer('ortho-grid')}
          updateActiveLayer={(updates) => setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, ...updates } : l))}
          deleteLayer={(id) => setLayers(prev => prev.filter(l => l.id !== id))}
          clearAllLayers={() => { if(confirm("確定要清空嗎？")) setLayers([]); }}
          undo={undo}
          canUndo={history.length > 0}
          toggleVisibility={(id) => setLayers(prev => prev.map(l => l.id === id ? {...l, visible: !l.visible} : l))}
          toggleLock={(id) => setLayers(prev => prev.map(l => l.id === id ? {...l, locked: !l.locked} : l))}
          workspaceZoom={workspaceZoom}
          setWorkspaceZoom={setWorkspaceZoom}
          enableSnapping={enableSnapping}
          setEnableSnapping={setEnableSnapping}
          onImageUpload={handleImageUpload}
          onExport={handleExport}
          onSaveProject={saveProject}
          onLoadProject={loadProject}
          isExporting={isExporting}
          hasImage={!!image}
          isGuideMode={isGuideMode}
          setIsGuideMode={setIsGuideMode}
        />
        <div className="flex-1 bg-[#020617] relative flex items-center justify-center overflow-hidden">
          {image ? (
            <PerspectiveCanvas 
              image={image}
              layers={layers}
              activeLayerId={activeLayerId}
              setActiveLayerId={setActiveLayerId}
              setLayers={setLayers}
              addVanishingPoint={(p) => addLayer('perspective', p)}
              deleteLayer={(id) => setLayers(prev => prev.filter(l => l.id !== id))}
              saveToHistory={saveToHistory}
              workspaceZoom={workspaceZoom}
              setWorkspaceZoom={setWorkspaceZoom}
              enableSnapping={enableSnapping}
              isGuideMode={isGuideMode}
              setIsGuideMode={setIsGuideMode}
            />
          ) : (
            <div className="text-center p-12 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-2xl">
              <div className="mb-6 inline-block p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">上傳您的參考圖片</h2>
              <p className="text-slate-500 text-sm mb-6">支援 JPG, PNG 或直接 Ctrl+V 貼上圖片</p>
              <label className="cursor-pointer px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl inline-block active:scale-95">
                選擇電腦中的檔案
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;