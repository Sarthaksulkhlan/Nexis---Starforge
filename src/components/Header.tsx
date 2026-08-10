import React from 'react';
import { ActiveView } from '../types';
import { Signal, BatteryCharging, Settings, Activity, Cpu, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isLive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, isLive = true }) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#10131a]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center px-4 md:px-8 py-3 w-full max-w-[1440px] mx-auto">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveView('matrix-core')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4d8eff] to-[#571bc1] p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(77,142,255,0.4)] group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Geist'] text-lg md:text-xl font-bold tracking-tight text-[#adc6ff]">MATRIX CORE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#4d8eff]/20 text-[#adc6ff] border border-[#4d8eff]/30 font-semibold">AURA</span>
            </div>
            <p className="hidden sm:block text-[10px] font-mono text-[#c2c6d6]/70 tracking-wider">ADAPTIVE VOICE AGENT</p>
          </div>
        </div>

        {/* View Switcher Navigation - Strictly Overview, Active Studio, Summary */}
        <nav className="flex items-center gap-1 lg:gap-2 bg-[#191b23]/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveView('matrix-core')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              activeView === 'matrix-core'
                ? 'bg-[#4d8eff]/20 text-[#adc6ff] border border-[#4d8eff]/40 shadow-[0_0_10px_rgba(77,142,255,0.2)]'
                : 'text-[#c2c6d6] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            onClick={() => setActiveView('active-session')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 relative ${
              activeView === 'active-session'
                ? 'bg-[#4d8eff] text-white font-semibold shadow-[0_0_15px_rgba(77,142,255,0.4)]'
                : 'text-[#c2c6d6] hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Active Studio
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={() => setActiveView('session-summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              activeView === 'session-summary'
                ? 'bg-[#4d8eff]/20 text-[#adc6ff] border border-[#4d8eff]/40 shadow-[0_0_10px_rgba(77,142,255,0.2)]'
                : 'text-[#c2c6d6] hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Summary
          </button>
        </nav>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#191b23]/60 px-2.5 py-1 rounded-full border border-white/5 text-[11px] font-mono text-[#c2c6d6]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>24ms</span>
          </div>

          <button title="Signal Status" className="text-[#c2c6d6] hover:text-[#adc6ff] transition-colors p-1">
            <Signal className="w-4 h-4" />
          </button>

          <button title="Battery Status" className="text-[#c2c6d6] hover:text-[#adc6ff] transition-colors p-1">
            <BatteryCharging className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setActiveView('session-summary')}
            title="System Settings" 
            className="text-[#c2c6d6] hover:text-[#adc6ff] transition-colors p-1 active:rotate-90 transition-transform"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
