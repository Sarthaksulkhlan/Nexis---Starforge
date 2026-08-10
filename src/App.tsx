/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ActiveView, ExperienceType, Session, VectorMemoryItem, ChatMessage } from './types';
import { EXPERIENCE_DATA } from './data/experienceData';
import { Header } from './components/Header';
import { MatrixCoreLanding } from './components/MatrixCoreLanding';
import { ActiveSessionStudio } from './components/ActiveSessionStudio';
import { SessionSummaryView } from './components/SessionSummaryView';
import { ExperienceModal } from './components/ExperienceModal';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('matrix-core');
  const [activeExperience, setActiveExperience] = useState<ExperienceType>('food');
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Session Duration Timer (In Seconds)
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

  // Long-Term Vector Memories Repository
  const [allMemories, setAllMemories] = useState<VectorMemoryItem[]>(
    EXPERIENCE_DATA.food.memories
  );

  // Current Session State initialized to Food Ordering by default
  const [currentSession, setCurrentSession] = useState<Session>(() => {
    const defaultExp = EXPERIENCE_DATA.food;
    return {
      id: `sess-${Date.now()}`,
      experience: 'food',
      title: defaultExp.taskTitle,
      model: 'AURA-v4.Turbo',
      latency: '22ms',
      status: 'LIVE',
      createdAt: new Date().toLocaleString(),
      actionsTakenCount: 1,
      memoriesUsedCount: defaultExp.memories.length,
      timeElapsed: '00:00:00',
      messages: defaultExp.demoMessages,
      memories: defaultExp.memories
    };
  });

  // Session Duration Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeView === 'active-session') {
      interval = setInterval(() => {
        setSessionDurationSeconds((prev) => {
          const next = prev + 1;
          // Format HH:MM:SS for session timeElapsed
          const h = Math.floor(next / 3600).toString().padStart(2, '0');
          const m = Math.floor((next % 3600) / 60).toString().padStart(2, '0');
          const s = (next % 60).toString().padStart(2, '0');
          setCurrentSession((sPrev) => ({ ...sPrev, timeElapsed: `${h}:${m}:${s}` }));
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView]);

  // Handle Experience Selection from Modal or Selector
  const handleSelectExperience = (expKey: ExperienceType) => {
    setActiveExperience(expKey);
    const expConfig = EXPERIENCE_DATA[expKey];

    // Reset session timer for new/switched session
    setSessionDurationSeconds(0);

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      experience: expKey,
      title: expConfig.taskTitle,
      model: 'AURA-v4.Turbo',
      latency: '22ms',
      status: 'LIVE',
      createdAt: new Date().toLocaleString(),
      actionsTakenCount: 1,
      memoriesUsedCount: expConfig.memories.length,
      timeElapsed: '00:00:00',
      messages: [...expConfig.demoMessages],
      memories: [...expConfig.memories]
    };

    setCurrentSession(newSession);
    setIsExperienceModalOpen(false);
    setActiveView('active-session');
  };

  // Trigger New Session
  const handleNewSession = () => {
    // Reset timer and temporary state, preserve long-term memories
    setSessionDurationSeconds(0);
    setIsExperienceModalOpen(true);
  };

  // Send message to Gemini server-side endpoint /api/chat
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return '';

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'YOU',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    setCurrentSession((prev) => ({
      ...prev,
      messages: updatedMessages
    }));

    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          taskTitle: currentSession.title,
          workflow: activeExperience,
          experience: activeExperience,
          userId: 'demo-user',
          sessionId: currentSession.id,
          history: updatedMessages,
          retrievedMemories: currentSession.memories
        })
      });

      const data = await response.json();
      const auraText = data.response || "I have retrieved your preference context and updated your active task.";

      const auraMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'AURA',
        text: auraText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const retrievedMemories = Array.isArray(data.retrievedContext)
        ? data.retrievedContext.map((memory: any, index: number) => ({
            id: memory.id || `qdrant-${Date.now()}-${index}`,
            code: `QDR-${String(index + 1).padStart(3, '0')}`,
            text: memory.text || 'Retrieved contextual memory',
            source: 'Qdrant Retrieval' as const,
            color: index % 2 === 0 ? 'primary' as const : 'tertiary' as const,
            pinned: false
          }))
        : [];

      setCurrentSession((prev) => ({
        ...prev,
        messages: [...updatedMessages, auraMsg],
        actionsTakenCount: prev.actionsTakenCount + (data.actionsTakenCount || 1),
        latency: data.latency?.totalMs ? `${data.latency.totalMs}ms` : prev.latency,
        model: 'Gemini + Rime',
        memories: retrievedMemories.length ? retrievedMemories : prev.memories,
        memoriesUsedCount: retrievedMemories.length || prev.memoriesUsedCount
      }));
      return auraText;
    } catch (err) {
      console.error("Error communicating with AURA server:", err);
      // Contextual fallback response
      let fallbackText = "I have updated your order with your preferred options.";
      if (activeExperience === 'healthcare') {
        fallbackText = "I can assist with appointment administrative tasks. Let me check clinic availability.";
      } else if (activeExperience === 'cooking') {
        fallbackText = "Step 2 is complete. Let me know when you're ready to proceed to simmer the sauce.";
      }

      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'AURA',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCurrentSession((prev) => ({
        ...prev,
        messages: [...updatedMessages, fallbackMsg]
      }));
      return fallbackText;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Memory Item
  const handleUpdateMemory = (updated: VectorMemoryItem) => {
    setAllMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setCurrentSession((prev) => ({
      ...prev,
      memories: prev.memories.map((m) => (m.id === updated.id ? updated : m))
    }));
  };

  // Add Memory Item
  const handleAddMemory = (text: string, source: any) => {
    const newMem: VectorMemoryItem = {
      id: `mem-${Date.now()}`,
      code: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      text,
      source: source || 'Context Analysis',
      color: 'primary',
      pinned: false
    };

    setAllMemories((prev) => [newMem, ...prev]);
    setCurrentSession((prev) => ({
      ...prev,
      memories: [newMem, ...prev.memories]
    }));
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#e1e2ec] font-['Inter'] selection:bg-[#4d8eff]/30 selection:text-white">
      
      {/* Navigation Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        isLive={currentSession.status === 'LIVE'}
      />

      {/* Main Views */}
      {activeView === 'matrix-core' && (
        <MatrixCoreLanding
          setActiveView={setActiveView}
          onOpenExperienceModal={() => setIsExperienceModalOpen(true)}
        />
      )}

      {activeView === 'active-session' && (
        <ActiveSessionStudio
          session={currentSession}
          activeExperience={activeExperience}
          onChangeExperience={handleSelectExperience}
          setActiveView={setActiveView}
          onSendMessage={handleSendMessage}
          onNewSession={handleNewSession}
          isProcessing={isProcessing}
          sessionDurationSeconds={sessionDurationSeconds}
        />
      )}

      {activeView === 'session-summary' && (
        <SessionSummaryView
          session={currentSession}
          setActiveView={setActiveView}
          onUpdateMemory={handleUpdateMemory}
          onAddMemory={handleAddMemory}
        />
      )}

      {/* Experience Selection Modal */}
      <ExperienceModal
        isOpen={isExperienceModalOpen}
        onClose={() => setIsExperienceModalOpen(false)}
        onSelectExperience={handleSelectExperience}
      />

    </div>
  );
}
