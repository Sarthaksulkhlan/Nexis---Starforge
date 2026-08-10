import React, { useState, useEffect } from 'react';
import { ActiveView } from '../types';
import { ThreeMatrixCore } from './ThreeMatrixCore';
import { SoundWaveRipple } from './SoundWaveRipple';
import { Mic, ArrowRight, History, Brain, Database, PlayCircle, FileText, Radio, Volume2, Sparkles } from 'lucide-react';
import { NexisLogo } from './NexisLogo';

interface MatrixCoreLandingProps {
  setActiveView: (view: ActiveView) => void;
  onOpenExperienceModal: () => void;
}

const TYPEWRITER_PHRASES = [
  "Never start a conversation from zero.",
  "Never start a task from zero.",
  "Never lose the context."
];

const CAPABILITIES = [
  { label: 'Context-aware voice', icon: Mic },
  { label: 'Workflow intelligence', icon: Brain },
  { label: 'Qdrant memory', icon: Database },
  { label: 'Gemini reasoning', icon: Sparkles },
  { label: 'Rime voice synthesis', icon: Volume2 },
  { label: 'LiveKit transport', icon: Radio },
];

export const MatrixCoreLanding: React.FC<MatrixCoreLandingProps> = ({
  setActiveView,
  onOpenExperienceModal,
}) => {
  // Typewriter State
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Ripple Interaction State
  const [isHoveringStartCta, setIsHoveringStartCta] = useState(false);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayedText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        }, 55); // Typing speed
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2200); // Pause when phrase is fully typed
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
        }, 30); // Erasing speed
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, phraseIndex]);

  const handleStartVoiceClick = () => {
    setPulseTrigger(Date.now());
    setTimeout(() => {
      onOpenExperienceModal();
    }, 120);
  };

  const handleExploreSystemClick = () => {
    setPulseTrigger(Date.now());
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#e1e2ec] font-['Inter'] relative overflow-x-hidden pt-20">
      
      {/* Background Ripple Animation - Layer 1 (Furthest Back) */}
      <SoundWaveRipple
        isHoveringCta={isHoveringStartCta}
        pulseTrigger={pulseTrigger}
      />

      {/* Background Subtle Grid & Lighting Effects - Layer 2 */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(173, 198, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(173, 198, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#4d8eff]/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Hero Section */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 pt-8 pb-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[calc(100vh-80px)]">
        
        {/* Left Hero Content */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit">
            <NexisLogo className="w-5 h-5" />
            <span className="font-mono text-xs text-[#adc6ff] uppercase tracking-wider font-semibold">
              Nexis / AURA Adaptive Voice Agent
            </span>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#89ceff]">Nexis</p>
            <h2 className="font-['Geist'] text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Adaptive Voice Agent
            </h2>
          </div>

          {/* Typewriter Headline */}
          <div className="min-h-[96px] sm:min-h-[122px] flex items-center">
            <h1 className="font-['Geist'] text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.12] tracking-tight text-white drop-shadow-[0_0_25px_rgba(173,198,255,0.3)]">
              {displayedText}
              <span className="animate-pulse text-[#4d8eff] ml-1">|</span>
            </h1>
          </div>

          {/* Hero Supporting Line */}
          <p className="text-base sm:text-lg text-[#c2c6d6] leading-relaxed max-w-xl">
            AURA understands the active workflow, retrieves relevant context from memory, reasons with Gemini, and continues conversations instead of starting from zero.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
            {CAPABILITIES.map(({ label, icon: Icon }) => (
              <div key={label} className="bg-[#10131a]/70 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#adc6ff]" />
                <span className="text-xs font-mono text-[#e1e2ec]">{label}</span>
              </div>
            ))}
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <button
              onClick={handleStartVoiceClick}
              onMouseEnter={() => setIsHoveringStartCta(true)}
              onMouseLeave={() => setIsHoveringStartCta(false)}
              className="bg-[#adc6ff] text-[#002e6a] px-7 py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold hover:bg-white transition-all shadow-[0_0_30px_rgba(173,198,255,0.4)] flex items-center gap-2.5 active:scale-95 group"
            >
              <Mic className="w-4 h-4 text-[#002e6a] fill-current group-hover:scale-110 transition-transform" />
              Start a Voice Session
            </button>

            <button
              onClick={handleExploreSystemClick}
              className="bg-white/5 text-white px-7 py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition-all border border-[#adc6ff]/30 flex items-center gap-2 active:scale-95"
            >
              Explore the System
            </button>
          </div>
        </div>

        {/* Central 3D Core Visualizer */}
        <div className="lg:col-span-6 relative h-[420px] sm:h-[520px] lg:h-[600px] w-full flex items-center justify-center">
          <div className="absolute inset-0 w-full h-full z-10">
            <ThreeMatrixCore />
          </div>

          {/* Floating Capability Badges */}
          <div className="absolute top-[15%] left-2 sm:left-6 z-20 bg-[#10131a]/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 border-l-4 border-l-[#4d8eff] shadow-xl animate-[bounce_4s_infinite]">
            <div className="font-mono text-[10px] text-[#c2c6d6] uppercase">Context Layer</div>
            <div className="font-mono text-xs text-white font-semibold">Session Continuity</div>
          </div>

          <div className="absolute top-[25%] right-2 sm:right-6 z-20 bg-[#10131a]/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 border-l-4 border-l-[#a855f7] shadow-xl animate-[bounce_5s_infinite_0.5s]">
            <div className="font-mono text-[10px] text-[#c2c6d6] uppercase">Voice Stack</div>
            <div className="font-mono text-xs text-white font-semibold">LiveKit + Rime</div>
          </div>

          <div className="absolute bottom-[20%] left-4 sm:left-10 z-20 bg-[#10131a]/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 border-l-4 border-l-[#10b981] shadow-xl animate-[bounce_4.5s_infinite_1s]">
            <div className="font-mono text-[10px] text-[#c2c6d6] uppercase">Memory Engine</div>
            <div className="font-mono text-xs text-white font-semibold">Qdrant Retrieval</div>
          </div>
        </div>

      </main>

      {/* Story Flow Section */}
      <section className="py-24 relative border-t border-white/10 bg-[#0b0e15]/70" id="how-it-works">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
          
          <div className="mb-14 text-center lg:text-left">
            <h2 className="font-['Geist'] text-3xl md:text-4xl font-bold text-white">Never Start From Zero</h2>
            <p className="text-[#c2c6d6] text-base max-w-2xl mt-3">AURA maintains workflow-specific context across sessions so the next turn starts with useful memory already in reach.</p>
          </div>

          {/* Horizontal Story Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 01 */}
            <div className="bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 border-t-[#4d8eff] border-t-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#adc6ff]">
                  <History className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-[#c2c6d6] uppercase">Step 01</span>
              </div>
              <h3 className="font-['Geist'] text-lg font-semibold text-white mb-2">Previous Task</h3>
              <div className="bg-[#10131a] p-3 rounded-xl border border-white/10 font-mono text-xs text-[#adc6ff] font-bold">
                Task Memory Stored
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 border-t-[#a855f7] border-t-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#d0bcff]">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-[#c2c6d6] uppercase">Step 02</span>
              </div>
              <h3 className="font-['Geist'] text-lg font-semibold text-white mb-2">Retrieved Context</h3>
              <div className="space-y-2">
                <div className="bg-[#10131a] p-2.5 rounded-lg border border-white/10 font-mono text-xs text-[#e1e2ec] flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#adc6ff]" />
                  <span>Qdrant Vectors Loaded</span>
                </div>
                <div className="bg-[#10131a] p-2.5 rounded-lg border border-white/10 font-mono text-xs text-[#e1e2ec] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#d0bcff]" />
                  <span>User Preferences</span>
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 border-t-[#10b981] border-t-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#34d399]">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-[#c2c6d6] uppercase">Step 03</span>
              </div>
              <h3 className="font-['Geist'] text-lg font-semibold text-white mb-2">Natural Voice</h3>
              <div className="bg-[#10131a] p-3 rounded-xl border border-white/10 font-serif italic text-sm text-[#e1e2ec]">
                "Continue from where we left off..."
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-[#4d8eff]/10 backdrop-blur-md p-6 rounded-2xl border border-[#4d8eff]/30 border-t-[#4d8eff] border-t-2 hover:border-[#4d8eff]/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#4d8eff]/20 flex items-center justify-center text-[#adc6ff]">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-[#adc6ff] uppercase font-bold">Step 04</span>
              </div>
              <h3 className="font-['Geist'] text-lg font-semibold text-white mb-2">Adaptive Action</h3>
              <div className="bg-[#10131a] p-3 rounded-xl border border-white/10 text-sm text-white font-medium">
                Task Completed Smoothly
              </div>
            </div>

          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onOpenExperienceModal}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4d8eff] to-[#571bc1] text-white font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(77,142,255,0.3)]"
            >
              <span>Choose Experience & Start</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 bg-[#05070a] border-t border-white/10 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-[#c2c6d6]">
        <div className="font-bold text-white text-sm">
          AURA / NEXIS
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => setActiveView('active-session')} className="hover:text-white transition-colors uppercase">Studio</button>
          <button onClick={() => setActiveView('session-summary')} className="hover:text-white transition-colors uppercase">Summary</button>
        </div>

        <div className="text-[11px] text-[#c2c6d6]/60 uppercase">
          © 2026 NEXIS ARCHITECTURE. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  );
};
