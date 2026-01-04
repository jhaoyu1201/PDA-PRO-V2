
import React from 'react';
import { Layer } from '../types';

interface ControlPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  setActiveLayerId: (id: string) => void;
  addVanishingPoint: () => void;
  addGridLayer: () => void; // 新增
  updateActiveLayer: (updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  clearAllLayers: () => void;
  undo: () => void;
  canUndo: boolean;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  workspaceZoom: number;
  setWorkspaceZoom: (val: number) => void;
  enableSnapping: boolean;
  setEnableSnapping: (val: boolean) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: (separate?: boolean) => void;
  onSaveProject: () => void;
  onLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExporting: boolean;
  hasImage: boolean;
  isGuideMode: boolean;
  setIsGuideMode: (val: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  layers,
  activeLayerId,
  setActiveLayerId,
  addVanishingPoint,
  addGridLayer,
  updateActiveLayer,
  deleteLayer,
  clearAllLayers,
  undo,
  canUndo,
  toggleVisibility,
  toggleLock,
  hasImage,
  onExport,
  onSaveProject,
  onLoadProject,
  isExporting,
  isGuideMode,
  setIsGuideMode
}) => {
  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <aside className="w-80 bg-slate-950 border-r border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      {/* 專案管理 */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">專案管理</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onSaveProject} disabled={layers.length === 0} className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>儲存
          </button>
          <label className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>開啟
            <input type="file" className="hidden" accept=".json" onChange={onLoadProject} />
          </label>
        </div>
      </section>

      {/* 1. 主要操作按鈕 */}
      <section className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">新增工具</h3>
          <div className="flex gap-2">
            <button onClick={undo} disabled={!canUndo} className={`p-1.5 rounded-lg border transition-all ${canUndo ? 'text-slate-300 border-slate-700 hover:bg-slate-800' : 'text-slate-700 border-slate-900 cursor-not-allowed'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={clearAllLayers} className="text-[9px] text-red-500 hover:bg-red-500/10 px-2 rounded uppercase font-bold">清空</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={addVanishingPoint}
            disabled={!hasImage}
            className={`py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl border border-blue-500/50 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${!hasImage ? 'opacity-40 grayscale' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm">新增消失點</span>
          </button>
          
          <button
            onClick={addGridLayer}
            disabled={!hasImage}
            className={`py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95 ${!hasImage ? 'opacity-40 grayscale' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16M7 4v16M12 4v16M17 4v16" /></svg>
            <span className="text-xs">新增網格基準</span>
          </button>
        </div>

        <button
          onClick={() => setIsGuideMode(!isGuideMode)}
          disabled={!hasImage}
          className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all mt-2 ${isGuideMode ? 'bg-amber-500 border-amber-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'} ${!hasImage ? 'opacity-40 grayscale' : ''}`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="text-xs font-bold">{isGuideMode ? '偵測中：請畫出兩條線' : '透視反推 (偵測定位)'}</span>
          </div>
        </button>
      </section>

      {/* 2. 圖層清單 */}
      <section className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">圖層列表</h3>
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {layers.map((layer) => (
            <div 
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${activeLayerId === layer.id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
            >
              <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }} className={`p-1 rounded ${layer.visible ? 'text-blue-400' : 'text-slate-600'}`}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.523 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }} className={`p-1 rounded ${layer.locked ? 'text-amber-500 bg-amber-500/10' : 'text-slate-600'}`}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              </button>
              <div className="flex-1 truncate text-xs font-bold text-slate-300">{layer.name}</div>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: layer.color }}></div>
              <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 屬性編輯器 */}
      {activeLayer && (
        <section className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{activeLayer.type === 'perspective' ? '消失點屬性' : '網格屬性'}</h3>
            <input type="color" value={activeLayer.color} onChange={(e) => updateActiveLayer({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
          </div>
          <div className="space-y-4">
            {activeLayer.type === 'perspective' ? (
              <div>
                <div className="flex justify-between text-[9px] mb-1.5 font-bold uppercase text-slate-500"><span>放射密度</span><span className="text-blue-400">{activeLayer.density}</span></div>
                <input type="range" min="1" max="48" step="1" value={activeLayer.density} onChange={(e) => updateActiveLayer({ density: Number(e.target.value) })} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between text-[9px] mb-1.5 font-bold uppercase text-slate-500"><span>垂直線密度 (X)</span><span className="text-blue-400">{activeLayer.density}</span></div>
                  <input type="range" min="2" max="60" step="1" value={activeLayer.density} onChange={(e) => updateActiveLayer({ density: Number(e.target.value) })} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] mb-1.5 font-bold uppercase text-slate-500"><span>水平線密度 (Y)</span><span className="text-blue-400">{activeLayer.densityY}</span></div>
                  <input type="range" min="2" max="60" step="1" value={activeLayer.densityY} onChange={(e) => updateActiveLayer({ densityY: Number(e.target.value) })} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
              </>
            )}
            <div>
              <div className="flex justify-between text-[9px] mb-1.5 font-bold uppercase text-slate-500"><span>線條粗細</span><span className="text-blue-400">{activeLayer.width}px</span></div>
              <input type="range" min="0.5" max="5" step="0.1" value={activeLayer.width} onChange={(e) => updateActiveLayer({ width: Number(e.target.value) })} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </section>
      )}

      {/* 4. 輸出按鈕 */}
      <section className="pt-4 border-t border-slate-800 space-y-2">
        <button onClick={() => onExport(false)} disabled={!hasImage || isExporting} className="w-full py-3.5 rounded-2xl font-bold bg-green-600 text-white hover:bg-green-500 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="text-xs">合併輸出 PNG</span>
        </button>
        <button onClick={() => onExport(true)} disabled={!hasImage || isExporting} className="w-full py-2.5 rounded-xl font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
          <span className="text-[10px]">一鍵分層批次輸出</span>
        </button>
      </section>
    </aside>
  );
};

export default ControlPanel;
