import React, { useState } from 'react';
import { Session, VectorMemoryItem, ActiveView } from '../types';
import { EXPERIENCE_DATA } from '../data/experienceData';
import { CheckCircle2, Edit2, Clock, Plus, Brain, ArrowRight } from 'lucide-react';

interface SessionSummaryViewProps {
  session: Session;
  setActiveView: (view: ActiveView) => void;
  onUpdateMemory: (memory: VectorMemoryItem) => void;
  onAddMemory: (memoryText: string, source: any) => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  session,
  setActiveView,
  onUpdateMemory,
  onAddMemory
}) => {
  const [editingMemory, setEditingMemory] = useState<VectorMemoryItem | null>(null);
  const [editText, setEditText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');

  const expConfig = EXPERIENCE_DATA[session.experience] || EXPERIENCE_DATA.food;

  const handleStartEdit = (mem: VectorMemoryItem) => {
    setEditingMemory(mem);
    setEditText(mem.text);
  };

  const handleSaveEdit = () => {
    if (editingMemory && editText.trim()) {
      onUpdateMemory({ ...editingMemory, text: editText.trim() });
      setEditingMemory(null);
    }
  };

  const handleAddNew = () => {
    if (newMemoryText.trim()) {
      onAddMemory(newMemoryText.trim(), 'Action taken');
      setNewMemoryText('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#e1e2ec] font-['Inter'] relative pt-24 pb-20 px-4 md:px-8 overflow-x-hidden flex flex-col justify-center items-center">
      
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4d8eff]/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#571bc1]/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-8 relative z-10">
        
        {/* Header */}
        <header className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#171622]/80 backdrop-blur-md border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(77,142,255,0.3)]">
            <CheckCircle2 className="w-8 h-8 text-[#adc6ff]" />
          </div>
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-white tracking-tight">
            MATRIX CORE | Session Summary
          </h1>
          <p className="text-base text-[#c2c6d6] font-medium">AURA / Adaptive Voice Agent</p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
          
          {/* Execution Metrics (5 cols) */}
          <div className="bg-[#111622]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-6 md:col-span-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4d8eff]/60 group-hover:bg-[#4d8eff] transition-colors" />
            
            <h2 className="font-mono text-xs text-[#8c909f] uppercase tracking-widest font-semibold">
              Execution Metrics
            </h2>

            <div className="flex flex-col gap-4 flex-1 justify-center">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs text-[#c2c6d6]">Task</span>
                <span className="text-sm font-bold text-white text-right truncate max-w-[160px]">
                  {expConfig.taskTitle}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs text-[#c2c6d6]">Actions Taken</span>
                <span className="font-mono text-xs text-[#adc6ff] bg-[#4d8eff]/15 px-2.5 py-1 rounded-md border border-[#4d8eff]/30 font-bold">
                  {session.actionsTakenCount}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs text-[#c2c6d6]">Memories Used</span>
                <span className="font-mono text-xs text-[#89ceff] bg-[#009ada]/15 px-2.5 py-1 rounded-md border border-[#009ada]/30 font-bold">
                  {session.memories.length}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-[#c2c6d6]">Time Elapsed</span>
                <span className="font-mono text-xs font-bold text-white">{session.timeElapsed}</span>
              </div>
            </div>
          </div>

          {/* What AURA Remembers (7 cols) */}
          <div className="bg-[#111622]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-5 md:col-span-7 relative group hover:border-white/20 transition-all">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#89ceff]/60 group-hover:bg-[#89ceff] transition-colors" />

            <div className="flex justify-between items-center">
              <h2 className="font-mono text-xs text-[#8c909f] uppercase tracking-widest font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#89ceff]" />
                What AURA remembers
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-mono text-[#adc6ff] hover:text-white flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Memory
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {session.memories.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-[#191b23]/70 border border-white/5 rounded-xl p-3.5 flex items-start justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-xs sm:text-sm text-white font-medium">{mem.text}</p>
                    <span className="font-mono text-[10px] text-[#8c909f]">Source: {mem.source}</span>
                  </div>

                  <button
                    onClick={() => handleStartEdit(mem)}
                    aria-label="Edit memory"
                    className="text-[#8c909f] hover:text-[#adc6ff] transition-colors p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto pt-4">
          <button
            onClick={() => setActiveView('active-session')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/30 text-[#e1e2ec] hover:text-white transition-all bg-white/5 font-medium text-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <Clock className="w-4 h-4" />
            Continue later
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4d8eff] to-[#005ac2] text-white font-medium text-sm shadow-[0_0_20px_rgba(77,142,255,0.3)] hover:shadow-[0_0_30px_rgba(77,142,255,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
            Correct memory
          </button>
        </div>

      </div>

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191b23] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-['Geist'] text-lg font-bold text-white">Edit Memory Item</h3>
            <p className="text-xs text-[#c2c6d6]">Code: {editingMemory.code} | Source: {editingMemory.source}</p>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-[#10131a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#4d8eff] h-28"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-[#c2c6d6] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-lg bg-[#4d8eff] text-white text-xs font-mono font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191b23] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-['Geist'] text-lg font-bold text-white">Add New Memory to Qdrant</h3>
            <p className="text-xs text-[#c2c6d6]">Store a new contextual fact or log for AURA to retain in future sessions.</p>
            <textarea
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="e.g. Preferred spicy level 8/10, extra garlic..."
              className="w-full bg-[#10131a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#4d8eff] h-28"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-[#c2c6d6] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNew}
                className="px-5 py-2 rounded-lg bg-[#4d8eff] text-white text-xs font-mono font-bold"
              >
                Add Memory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
