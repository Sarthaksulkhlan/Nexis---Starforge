import React from 'react';
import { Session, ActiveView } from '../types';
import { Sidebar } from './Sidebar';
import { Archive, Play, CheckCircle2, Clock, Cpu, ArrowRight } from 'lucide-react';

interface ArchiveSessionsProps {
  archivedSessions: Session[];
  setActiveView: (view: ActiveView) => void;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
}

export const ArchiveSessions: React.FC<ArchiveSessionsProps> = ({
  archivedSessions,
  setActiveView,
  onSelectSession,
  onNewSession,
}) => {
  return (
    <div className="min-h-screen bg-[#05070a] text-[#e1e2ec] font-['Inter'] relative flex flex-col md:flex-row pt-16">
      
      <Sidebar
        activeView="archive"
        setActiveView={setActiveView}
        onNewSession={onNewSession}
      />

      <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-[1440px] mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-6 h-6 text-[#adc6ff]" />
              <h1 className="font-['Geist'] text-2xl md:text-3xl font-bold text-white">
                Troubleshooting Session Archive
              </h1>
            </div>
            <p className="text-xs font-mono text-[#c2c6d6]">
              Historical records of past AURA voice interaction logs, execution metrics, and retrieved memories.
            </p>
          </div>

          <button
            onClick={onNewSession}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8eff] to-[#571bc1] text-white font-mono text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-[0_0_15px_rgba(77,142,255,0.3)] transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Start New Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {archivedSessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-[#111622]/50 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-white/20 transition-all group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-['Geist'] text-lg font-bold text-white group-hover:text-[#adc6ff] transition-colors">
                    {sess.title}
                  </span>
                  <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#34d399] font-bold border border-[#10b981]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> COMPLETED
                  </span>
                </div>

                <p className="text-xs text-[#c2c6d6] font-mono">
                  Created: {sess.createdAt} • Model: {sess.model} • Latency: {sess.latency}
                </p>

                <div className="flex flex-wrap gap-4 pt-1 font-mono text-xs text-[#8c909f]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#adc6ff]" /> {sess.timeElapsed} duration
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-[#d0bcff]" /> {sess.actionsTakenCount} actions taken
                  </span>
                  <span className="flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5 text-[#89ceff]" /> {sess.memories.length} vector memories
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectSession(sess)}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-white/5 hover:bg-[#4d8eff] text-white font-mono text-xs font-bold border border-white/10 hover:border-transparent transition-all flex items-center justify-center gap-2"
              >
                <span>Load Session Context</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

      </main>

    </div>
  );
};
