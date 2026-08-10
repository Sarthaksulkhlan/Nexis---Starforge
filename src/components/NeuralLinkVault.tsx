import React, { useState } from 'react';
import { VectorMemoryItem, ActiveView } from '../types';
import { Sidebar } from './Sidebar';
import { Database, Search, Plus, Edit2, Trash2, Pin, CheckCircle, Sparkles, Filter } from 'lucide-react';

interface NeuralLinkVaultProps {
  memories: VectorMemoryItem[];
  setActiveView: (view: ActiveView) => void;
  onUpdateMemory: (item: VectorMemoryItem) => void;
  onAddMemory: (text: string, source: any) => void;
  onDeleteMemory: (id: string) => void;
  onNewSession: () => void;
}

export const NeuralLinkVault: React.FC<NeuralLinkVaultProps> = ({
  memories,
  setActiveView,
  onUpdateMemory,
  onAddMemory,
  onDeleteMemory,
  onNewSession,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<VectorMemoryItem | null>(null);
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newSource, setNewSource] = useState<any>('Context Analysis');

  const filteredMemories = memories.filter((mem) => {
    const matchesSearch = mem.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mem.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === 'ALL' || mem.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const handleSaveEdit = () => {
    if (editingItem && editText.trim()) {
      onUpdateMemory({ ...editingItem, text: editText.trim() });
      setEditingItem(null);
    }
  };

  const handleAddSubmit = () => {
    if (newText.trim()) {
      onAddMemory(newText.trim(), newSource);
      setNewText('');
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#e1e2ec] font-['Inter'] relative flex flex-col md:flex-row pt-16">
      
      <Sidebar
        activeView="neural-link"
        setActiveView={setActiveView}
        onNewSession={onNewSession}
      />

      <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-[1440px] mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-6 h-6 text-[#adc6ff]" />
              <h1 className="font-['Geist'] text-2xl md:text-3xl font-bold text-white">
                Neural Link & Qdrant Memory Store
              </h1>
            </div>
            <p className="text-xs font-mono text-[#c2c6d6]">
              Vector groundings, historical incident memory, and system facts stored for AURA.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8eff] to-[#571bc1] text-white font-mono text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-[0_0_15px_rgba(77,142,255,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Memory Vector
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#111622]/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
          
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8c909f] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search memory codes, tags, or facts..."
              className="w-full bg-[#10131a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#4d8eff]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-4 h-4 text-[#8c909f]" />
            {['ALL', 'Context Analysis', 'Historical Log', 'Action taken'].map((source) => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                  filterSource === source
                    ? 'bg-[#4d8eff] text-white font-bold'
                    : 'bg-white/5 text-[#c2c6d6] hover:bg-white/10'
                }`}
              >
                {source}
              </button>
            ))}
          </div>

        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="bg-[#111622]/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-white/20 transition-all relative group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    mem.color === 'primary' ? 'bg-[#4d8eff]/20 text-[#adc6ff]' :
                    mem.color === 'secondary' ? 'bg-[#571bc1]/20 text-[#d0bcff]' :
                    'bg-[#009ada]/20 text-[#89ceff]'
                  }`}>
                    {mem.code}
                  </span>
                  <span className="text-[10px] font-mono text-[#8c909f]">
                    {mem.source}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onUpdateMemory({ ...mem, pinned: !mem.pinned })}
                    title="Pin memory"
                    className={`p-1 rounded hover:bg-white/10 ${mem.pinned ? 'text-[#adc6ff]' : 'text-[#8c909f]'}`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(mem);
                      setEditText(mem.text);
                    }}
                    title="Edit memory"
                    className="p-1 rounded text-[#8c909f] hover:text-[#adc6ff] hover:bg-white/10"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    title="Delete memory"
                    className="p-1 rounded text-[#8c909f] hover:text-red-400 hover:bg-white/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-white leading-relaxed">{mem.text}</p>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center font-mono text-[10px] text-[#8c909f]">
                <span>Vector Dimension: 1536d</span>
                <span className="text-[#34d399] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Grounded
                </span>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191b23] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-['Geist'] text-lg font-bold text-white">Edit Memory Vector</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-[#10131a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#4d8eff] h-28"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs font-mono text-[#c2c6d6]">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-lg bg-[#4d8eff] text-white text-xs font-mono font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191b23] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-['Geist'] text-lg font-bold text-white">New Qdrant Memory Vector</h3>
            <div>
              <label className="block text-xs font-mono text-[#c2c6d6] mb-1">Source Type</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-[#10131a] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#4d8eff]"
              >
                <option value="Context Analysis">Context Analysis</option>
                <option value="Historical Log">Historical Log</option>
                <option value="Action taken">Action taken</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#c2c6d6] mb-1">Fact / Technical Memory</label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. Workstation MAC address bound to static IP 192.168.1.10..."
                className="w-full bg-[#10131a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#4d8eff] h-28"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-mono text-[#c2c6d6]">Cancel</button>
              <button onClick={handleAddSubmit} className="px-5 py-2 rounded-lg bg-[#4d8eff] text-white text-xs font-mono font-bold">Add Vector</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
