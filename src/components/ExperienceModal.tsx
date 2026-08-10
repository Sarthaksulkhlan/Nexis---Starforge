import React from 'react';
import { ExperienceType } from '../types';
import { EXPERIENCE_DATA } from '../data/experienceData';
import { Utensils, HeartPulse, ChefHat, Sparkles, X, ArrowRight } from 'lucide-react';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectExperience: (experience: ExperienceType) => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  onSelectExperience,
}) => {
  if (!isOpen) return null;

  const getIcon = (id: ExperienceType) => {
    switch (id) {
      case 'food':
        return <Utensils className="w-6 h-6 text-[#adc6ff]" />;
      case 'healthcare':
        return <HeartPulse className="w-6 h-6 text-[#d0bcff]" />;
      case 'cooking':
        return <ChefHat className="w-6 h-6 text-[#89ceff]" />;
    }
  };

  const getBorderColor = (id: ExperienceType) => {
    switch (id) {
      case 'food':
        return 'border-t-[#4d8eff] hover:border-[#4d8eff]/80 hover:shadow-[0_0_30px_rgba(77,142,255,0.25)]';
      case 'healthcare':
        return 'border-t-[#a855f7] hover:border-[#a855f7]/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]';
      case 'cooking':
        return 'border-t-[#0ea5e9] hover:border-[#0ea5e9]/80 hover:shadow-[0_0_30px_rgba(14,165,233,0.25)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b0e15] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-4xl w-full relative shadow-[0_0_80px_rgba(0,0,0,0.8)] my-auto">
        
        {/* Optional Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#8c909f] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4d8eff]/15 border border-[#4d8eff]/30 font-mono text-xs text-[#adc6ff] font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>ADAPTIVE TASK AGENT</span>
          </div>

          <h2 className="font-['Geist'] text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Choose your experience
          </h2>

          <p className="text-sm sm:text-base text-[#c2c6d6] leading-relaxed">
            AURA adapts its conversation, knowledge, and actions to the task you choose.
          </p>
        </div>

        {/* Exactly 3 Visually Equal Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['food', 'healthcare', 'cooking'] as ExperienceType[]).map((expKey) => {
            const exp = EXPERIENCE_DATA[expKey];
            return (
              <div
                key={expKey}
                onClick={() => onSelectExperience(expKey)}
                className={`bg-[#111622]/80 backdrop-blur-md border border-white/10 border-t-2 ${getBorderColor(
                  expKey
                )} rounded-2xl p-6 flex flex-col justify-between cursor-pointer group transition-all transform hover:-translate-y-1 active:scale-98`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {getIcon(expKey)}
                    </div>
                    <span className="font-mono text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#adc6ff] uppercase">
                      {exp.tag}
                    </span>
                  </div>

                  <h3 className="font-['Geist'] text-xl font-bold text-white group-hover:text-[#adc6ff] transition-colors">
                    {exp.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#c2c6d6] leading-relaxed">
                    {exp.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-mono font-bold text-[#adc6ff] group-hover:text-white transition-colors">
                  <span>LAUNCH EXPERIENCE</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
