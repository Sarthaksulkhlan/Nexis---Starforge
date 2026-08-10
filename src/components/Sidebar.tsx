import React from 'react';
import { ActiveView } from '../types';
import { Sparkles, Cpu, Activity, Plus } from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onNewSession: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onNewSession }) => {
  return (
    <nav className="hidden md:flex flex-col h-[calc(100vh-64px)] py-6 bg-[#191b23]/80 backdrop-blur-2xl fixed left-0 top-[64px] w-64 border-r border-white/10 shadow-2xl z-40">
      
      {/* Header */}
      <div className="px-6 mb-6">
        <h2 className="font-['Geist'] text-2xl font-bold text-[#adc6ff]">Core System</h2>
        <p className="font-mono text-xs text-[#c2c6d6]/70 mt-1">AURA Adaptive Voice</p>
      </div>

      {/* New Session Button */}
      <div className="px-6 mb-6">
        <button
          onClick={onNewSession}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#4d8eff] to-[#571bc1] text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_15px_rgba(77,142,255,0.3)] active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Primary Links */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <button
          onClick={() => setActiveView('matrix-core')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-xs transition-all ${
            activeView === 'matrix-core'
              ? 'bg-[#009ada]/20 text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
              : 'text-[#c2c6d6] hover:bg-white/5 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#89ceff]" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveView('active-session')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-xs transition-all ${
            activeView === 'active-session'
              ? 'bg-[#009ada]/20 text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
              : 'text-[#c2c6d6] hover:bg-white/5 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#adc6ff]" />
          <span>Active Studio</span>
        </button>

        <button
          onClick={() => setActiveView('session-summary')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-xs transition-all ${
            activeView === 'session-summary'
              ? 'bg-[#009ada]/20 text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
              : 'text-[#c2c6d6] hover:bg-white/5 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-[#d0bcff]" />
          <span>Summary</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="px-6 pt-4 border-t border-white/5">
        <div className="font-mono text-[10px] text-[#c2c6d6]/60 uppercase space-y-1">
          <div>AURA VOICE CORE v2.4</div>
          <div className="text-emerald-400">● QDRANT CONNECTED</div>
        </div>
      </div>

    </nav>
  );
};
