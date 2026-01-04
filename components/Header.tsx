
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          透視繪圖助手 Pro <span className="text-sm font-normal text-slate-500 ml-2">Perspective Art Studio</span>
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          v1.0.0 Stable
        </div>
      </div>
    </header>
  );
};

export default Header;
