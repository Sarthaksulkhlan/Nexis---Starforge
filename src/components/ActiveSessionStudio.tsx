import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, createLocalAudioTrack } from 'livekit-client';
import { Session, ExperienceType, VoiceCoreState, ActiveView, ChatMessage } from '../types';
import { EXPERIENCE_DATA } from '../data/experienceData';
import { ThreeOrb } from './ThreeOrb';
import { Sidebar } from './Sidebar';
import { 
  Mic, MicOff, Keyboard, StopCircle, Send, MemoryStick as Memory, 
  Database, Check, ChevronDown, Activity, RefreshCw
} from 'lucide-react';

interface ActiveSessionStudioProps {
  session: Session;
  activeExperience: ExperienceType;
  onChangeExperience: (exp: ExperienceType) => void;
  setActiveView: (view: ActiveView) => void;
  onSendMessage: (text: string) => Promise<string>;
  onVoiceMessage: (sender: ChatMessage['sender'], text: string) => void;
  onNewSession: () => void;
  isProcessing: boolean;
  sessionDurationSeconds: number;
}

export const ActiveSessionStudio: React.FC<ActiveSessionStudioProps> = ({
  session,
  activeExperience,
  onChangeExperience,
  setActiveView,
  onSendMessage,
  onVoiceMessage,
  onNewSession,
  isProcessing,
  sessionDurationSeconds
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showExperienceMenu, setShowExperienceMenu] = useState(false);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [agentIdentity, setAgentIdentity] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceTransportState, setVoiceTransportState] = useState<'CONNECTING' | 'AGENT JOINING' | 'AGENT READY' | 'ERROR'>('CONNECTING');
  const [voicePipelineState, setVoicePipelineState] = useState<VoiceCoreState>('CONNECTING');

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const micTrackRef = useRef<any>(null);
  const typedAudioRef = useRef<HTMLAudioElement | null>(null);
  const committedVoiceMessagesRef = useRef<Set<string>>(new Set());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const voiceSessionStartedAtRef = useRef<number>(0);

  const currentExpConfig = EXPERIENCE_DATA[activeExperience] || EXPERIENCE_DATA.food;

  const voiceState: VoiceCoreState = isProcessing ? 'RETRIEVING CONTEXT' : voicePipelineState;

  // Format Session Duration HH:MM:SS
  const formatDuration = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isProcessing]);

  useEffect(() => {
    let cancelled = false;
    const textDecoder = new TextDecoder();

    const findAgentIdentity = (room: Room) => {
      for (const participant of room.remoteParticipants.values()) {
        const attrs = (participant as any).attributes || {};
        const identity = participant.identity || '';
        if (attrs['lk.agent.name'] === 'matrix-core-agent' || identity.toLowerCase().includes('agent')) {
          return identity;
        }
      }
      const first = room.remoteParticipants.values().next().value;
      return first?.identity || null;
    };

    const commitVoiceMessage = (id: string, sender: ChatMessage['sender'], text: string) => {
      const cleanText = text.trim();
      if (!cleanText || committedVoiceMessagesRef.current.has(id)) return;
      committedVoiceMessagesRef.current.add(id);
      onVoiceMessage(sender, cleanText);
    };

    const markAgentReady = (identity?: string) => {
      if (identity) setAgentIdentity(identity);
      setVoiceTransportState('AGENT READY');
      setVoicePipelineState('AGENT_READY');
      setVoiceError(null);
    };

    const connectLiveKit = async () => {
      try {
        voiceSessionStartedAtRef.current = performance.now();
        console.info('[VOICE] session-start: 0ms');
        setVoiceTransportState('CONNECTING');
        setVoicePipelineState('CONNECTING');
        setVoiceError(null);
        committedVoiceMessagesRef.current.clear();

        const tokenResponse = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow: activeExperience,
            userId: 'demo-user',
            roomName: `matrix-core-${session.id}`
          })
        });
        if (!tokenResponse.ok) throw new Error('LiveKit token unavailable');
        const { url, token } = await tokenResponse.json();
        console.info(`[VOICE] token-received: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: any, publication: any) => {
          if (track.kind !== 'audio' || !track.attach) return;
          const audioKey = publication?.trackSid || track.sid || `${Date.now()}`;
          remoteAudioElementsRef.current.get(audioKey)?.remove();
          const element = track.attach() as HTMLAudioElement;
          element.autoplay = true;
          element.dataset.livekitTrackSid = audioKey;
          remoteAudioElementsRef.current.set(audioKey, element);
          document.body.appendChild(element);
          console.info(`[VOICE] livekit-audio-track-subscribed: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms track=${audioKey}`);
          element.play().catch((error) => {
            console.warn('LiveKit audio playback failed:', error);
            setIsSpeaking(false);
            setVoicePipelineState('AGENT_READY');
          });
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: any, publication: any) => {
          track.detach?.().forEach((element: HTMLMediaElement) => element.remove());
          const audioKey = publication?.trackSid || track.sid;
          if (audioKey) {
            remoteAudioElementsRef.current.get(audioKey)?.remove();
            remoteAudioElementsRef.current.delete(audioKey);
          }
          console.info(`[VOICE] livekit-audio-track-unsubscribed: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
        });

        room.on(RoomEvent.ParticipantConnected, (participant) => {
          const attrs = (participant as any).attributes || {};
          if (attrs['lk.agent.name'] === 'matrix-core-agent' || participant.identity.toLowerCase().includes('agent')) {
            setAgentIdentity(participant.identity);
            setVoiceTransportState('AGENT JOINING');
            setVoicePipelineState('CONNECTING');
            setVoiceError('AURA joined. Preparing voice controls...');
          }
        });

        room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
          if (!topic?.startsWith('aura.')) return;
          try {
            const decoded = textDecoder.decode(payload);
            const event = JSON.parse(decoded);
            if (event?.type === 'aura_ready') {
              console.info(`[VOICE] agent-ready: ${event.elapsed_ms ?? Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
              markAgentReady(participant?.identity);
            }
            if (event?.type === 'voice_state' && event.state) {
              const nextState = event.state as VoiceCoreState;
              setVoicePipelineState(nextState);
              setIsListening(nextState === 'LISTENING');
              setIsSpeaking(nextState === 'SPEAKING');
              console.info(`[VOICE] ${event.phase || 'state'}: ${event.elapsed_ms ?? Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms state=${event.state}`);
            }
            if (event?.type === 'aura_chat_message' && event.text) {
              const sender: ChatMessage['sender'] = event.role === 'user' ? 'YOU' : 'AURA';
              commitVoiceMessage(`${event.role}-${event.text}`, sender, event.text);
              if (sender === 'YOU') setVoicePipelineState('THINKING');
              console.info(`[VOICE] chat-${sender.toLowerCase()}-update: ${event.elapsed_ms ?? Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
            }
          } catch (error) {
            console.warn('Unable to parse AURA LiveKit data packet:', error);
          }
        });

        room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
          segments.forEach((segment) => {
            if (!segment.final) return;
            const sender: ChatMessage['sender'] = participant?.identity === room.localParticipant.identity ? 'YOU' : 'AURA';
            commitVoiceMessage(`transcript-${sender}-${segment.id}`, sender, segment.text);
            if (sender === 'YOU') setVoicePipelineState('THINKING');
            console.info(`[VOICE] stt-final: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
          });
        });

        room.on(RoomEvent.ChatMessage, (message, participant) => {
          const sender: ChatMessage['sender'] = participant?.identity === room.localParticipant.identity ? 'YOU' : 'AURA';
          commitVoiceMessage(`chat-${sender}-${message.id}`, sender, message.message);
        });

        room.on(RoomEvent.Disconnected, () => {
          setIsLiveKitConnected(false);
          setAgentIdentity(null);
          setIsListening(false);
          setIsSpeaking(false);
          setVoiceTransportState('ERROR');
          setVoicePipelineState('ERROR');
          setVoiceError('LiveKit disconnected. Reopen the session to reconnect.');
        });

        await room.connect(url, token);
        console.info(`[VOICE] livekit-connect: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);

        if (!cancelled) {
          setIsLiveKitConnected(true);
          const identity = findAgentIdentity(room);
          setAgentIdentity(identity);
          setVoiceTransportState('AGENT JOINING');
          setVoicePipelineState('CONNECTING');
          setVoiceError(identity ? 'AURA joined. Preparing voice controls...' : 'Connected to LiveKit. Waiting for AURA agent to join.');
        }
      } catch (error) {
        console.warn('LiveKit connection failed:', error);
        setIsLiveKitConnected(false);
        setVoiceTransportState('ERROR');
        setVoicePipelineState('ERROR');
        setVoiceError('LiveKit is disconnected. Check the server, agent, and LiveKit credentials.');
      }
    };

    connectLiveKit();

    return () => {
      cancelled = true;
      micTrackRef.current?.stop?.();
      micTrackRef.current = null;
      typedAudioRef.current?.pause();
      typedAudioRef.current = null;
      roomRef.current?.disconnect();
      roomRef.current = null;
      remoteAudioElementsRef.current.forEach((element) => element.remove());
      remoteAudioElementsRef.current.clear();
    };
  }, [activeExperience, session.id, onVoiceMessage]);

  const getAgentDestination = (room: Room) => {
    const firstParticipant = Array.from(room.remoteParticipants.values())[0] as { identity?: string } | undefined;
    return agentIdentity || firstParticipant?.identity || null;
  };

  const ensureMicrophoneTrack = async (room: Room) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not expose microphone capture.');
    }

    if (!micTrackRef.current) {
      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      await room.localParticipant.publishTrack(track, { name: 'aura-user-microphone' });
      micTrackRef.current = track;
      console.info('[AURA voice] microphone track published to LiveKit');
    }

    return micTrackRef.current;
  };

  const describeVoiceError = (error: unknown) => {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'Microphone permission was denied. Allow microphone access in your browser.';
    }
    if (error instanceof Error) return error.message;
    return 'Unable to start the voice turn.';
  };

  const toggleMic = async () => {
    if (!isLiveKitConnected || !roomRef.current) {
      setVoiceError('LiveKit voice is not connected. Start the Node server and Python agent, then reopen this session.');
      return;
    }

    const room = roomRef.current;
    const destinationIdentity = getAgentDestination(room);
    if (!destinationIdentity || voiceTransportState !== 'AGENT READY') {
      setVoiceError('Connecting to AURA. Wait until voice transport shows AGENT READY.');
      return;
    }

    if (isListening) {
      try {
        await micTrackRef.current?.mute?.();
        setVoicePipelineState('THINKING');
        console.info(`[VOICE] mic-stop: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
        await room.localParticipant.performRpc({
          destinationIdentity,
          method: 'end_turn',
          payload: JSON.stringify({ workflow: activeExperience }),
          responseTimeout: 5000
        });
        setIsListening(false);
        setVoiceError(null);
      } catch (error: unknown) {
        console.warn('end_turn RPC failed:', error);
        setVoiceError('AURA did not accept the end-turn signal. Try again.');
      }
      return;
    }

    try {
      setVoiceTransportState('AGENT READY');
      setVoicePipelineState(isSpeaking ? 'INTERRUPTED' : 'LISTENING');
      if (isSpeaking) {
        setVoiceError('Interrupting AURA...');
        remoteAudioElementsRef.current.forEach((element) => {
          element.pause();
          element.currentTime = 0;
        });
      }
      console.info(`[VOICE] mic-start: ${Math.round(performance.now() - voiceSessionStartedAtRef.current)}ms`);
      await room.localParticipant.performRpc({
        destinationIdentity,
        method: 'start_turn',
        payload: JSON.stringify({ workflow: activeExperience }),
        responseTimeout: 5000
      });
      const track = await ensureMicrophoneTrack(room);
      await track.unmute?.();
      setIsListening(true);
      setVoicePipelineState('LISTENING');
      setVoiceError(null);
    } catch (error: unknown) {
      console.warn('start voice turn failed:', error);
      setVoiceError(describeVoiceError(error));
      room.localParticipant.performRpc({
        destinationIdentity,
        method: 'cancel_turn',
        payload: JSON.stringify({ workflow: activeExperience }),
        responseTimeout: 3000
      }).catch(() => undefined);
      setIsListening(false);
      setVoicePipelineState('AGENT_READY');
    }
  };

  const speakText = async (text: string) => {
    if (isLiveKitConnected) return;
    setIsSpeaking(true);
    typedAudioRef.current?.pause();
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();

      if (data.audio) {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        typedAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (typedAudioRef.current === audio) typedAudioRef.current = null;
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (typedAudioRef.current === audio) typedAudioRef.current = null;
          setIsSpeaking(false);
        };
        await audio.play();
        return;
      }

      throw new Error(data.error || 'Rime audio unavailable');
    } catch (error) {
      console.warn('Rime playback failed:', error);
      setVoiceError('Rime audio playback failed for the typed response.');
      setIsSpeaking(false);
    }
  };

  const handleSendUserMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    setInputText('');
    setIsListening(false);
    setVoicePipelineState(isLiveKitConnected ? 'THINKING' : voicePipelineState);
    
    const auraText = await onSendMessage(msgText);
    if (auraText) await speakText(auraText);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-[#e1e2ec] font-['Inter'] relative flex flex-col md:flex-row overflow-hidden antialiased pt-16">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeView="active-session"
        setActiveView={setActiveView}
        onNewSession={onNewSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64 relative z-10 pb-20 md:pb-0 h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto p-4 md:p-6 gap-4 h-full">
          
          {/* Left Panel: Active Session & Experience Selector */}
          <div className="w-full lg:w-1/4 bg-[#111622]/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col gap-4 relative shadow-2xl overflow-y-auto">
            
            {/* Active Experience Selector */}
            <div className="bg-[#191b23] border border-white/15 rounded-xl p-3.5 relative">
              <span className="font-mono text-[10px] text-[#adc6ff] uppercase tracking-wider font-bold block mb-1">
                Active Experience
              </span>

              <div 
                onClick={() => setShowExperienceMenu(!showExperienceMenu)}
                className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <span className="font-['Geist'] font-bold text-white text-sm">
                    {currentExpConfig.badge}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#adc6ff] uppercase">
                    {currentExpConfig.tag}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#adc6ff] transition-transform ${showExperienceMenu ? 'rotate-180' : ''}`} />
              </div>

              {/* Experience Dropdown */}
              {showExperienceMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1017] border border-white/20 rounded-xl p-1.5 z-50 shadow-2xl space-y-1 animate-fadeIn">
                  {(['food', 'healthcare', 'cooking'] as ExperienceType[]).map((expKey) => {
                    const item = EXPERIENCE_DATA[expKey];
                    return (
                      <button
                        key={expKey}
                        onClick={() => {
                          onChangeExperience(expKey);
                          setShowExperienceMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-all ${
                          activeExperience === expKey
                            ? 'bg-[#4d8eff]/20 text-white font-bold border border-[#4d8eff]/40'
                            : 'text-[#c2c6d6] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{item.badge}</span>
                        <span className="text-[9px] opacity-70">{item.tag}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Session Info Details */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 pt-1">
              <h3 className="font-mono text-xs text-[#c2c6d6] uppercase tracking-widest font-semibold">
                Session Metrics
              </h3>
              <div className="flex items-center gap-1.5 bg-[#4d8eff]/20 px-2.5 py-1 rounded-full border border-[#4d8eff]/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[10px] text-[#adc6ff] font-bold">LIVE</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 font-mono text-xs">
              {/* Session Duration Timer */}
              <div className="bg-[#10131a] p-3 rounded-xl border border-white/10 flex justify-between items-center shadow-inner">
                <span className="text-[#c2c6d6] uppercase text-[10px]">Session Duration</span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider font-mono">
                  {formatDuration(sessionDurationSeconds)}
                </span>
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-[#c2c6d6]">Latency</span>
                <span className="text-[#d0bcff] font-semibold">{session.latency}</span>
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-[#c2c6d6]">Model</span>
                <span className="text-[#adc6ff] font-semibold">{session.model}</span>
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-[#c2c6d6]">Task Context</span>
                <span className="text-white font-semibold">{currentExpConfig.taskTitle}</span>
              </div>
            </div>

            {/* AURA VOICE CORE Branding (NO HUMAN FACE) */}
            <div className="mt-auto pt-4 flex flex-col items-center">
              <div className="w-full h-px bg-white/10 mb-4" />

              <div className="flex items-center gap-2 text-center">
                <Activity className="w-5 h-5 text-[#adc6ff] animate-pulse" />
                <span className="font-['Geist'] text-xl font-bold bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] bg-clip-text text-transparent">
                  AURA VOICE CORE
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#c2c6d6]/70 mt-1 uppercase tracking-wider">
                Abstract Neural Audio Engine
              </p>
            </div>

          </div>

          {/* Center Panel: 3D Voice Core Visualizer & Transcript */}
          <div className="flex-1 flex flex-col relative items-center h-full min-h-0">
            
            {/* Dynamic Voice State Label */}
            <div className="my-2 z-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10131a]/80 backdrop-blur-md border border-white/15 shadow-lg">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isSpeaking ? 'bg-[#a855f7] animate-ping' : isListening ? 'bg-emerald-400 animate-ping' : 'bg-[#4d8eff] animate-pulse'
                }`} />
                <span className="font-mono text-xs font-bold tracking-widest text-[#adc6ff] uppercase">
                  {voiceState}
                </span>
              </div>
            </div>

            {/* 3D Orb Voice Core Visualizer (NO FACE) */}
            <div className="relative w-full max-w-xs lg:max-w-sm aspect-square flex items-center justify-center flex-1 min-h-[220px] max-h-[42vh]">
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                isListening 
                  ? 'bg-emerald-500/20 blur-[80px]' 
                  : isSpeaking 
                  ? 'bg-purple-500/25 blur-[80px]' 
                  : 'bg-[#4d8eff]/15 blur-[60px]'
              }`} />
              
              <ThreeOrb
                isListening={isListening}
                isSpeaking={isSpeaking}
                className="w-full h-full relative z-10"
              />
            </div>

            {/* Live Transcript Box */}
            <div className="w-full max-w-2xl bg-[#111622]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col min-h-0">
              <div className="max-h-44 lg:max-h-56 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {session.messages.map((msg) => (
                  <div key={msg.id} className="text-sm sm:text-base leading-relaxed">
                    <span className={`font-mono text-xs uppercase mr-2 font-bold ${
                      msg.sender === 'YOU' ? 'text-[#d0bcff]' : 'text-[#adc6ff]'
                    }`}>
                      {msg.sender}
                    </span>
                    <span className={msg.sender === 'YOU' ? 'text-[#c2c6d6]' : 'text-white font-medium'}>
                      {msg.text}
                    </span>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#adc6ff] animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AURA RETRIEVING CONTEXT...</span>
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="z-30 flex flex-col items-center gap-2 mt-3 shrink-0">
              <div className={`font-mono text-[10px] px-3 py-1 rounded-full border ${
                voiceError
                  ? 'bg-red-500/10 border-red-400/30 text-red-200'
                  : voiceTransportState === 'AGENT READY'
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                  : 'bg-[#4d8eff]/10 border-[#adc6ff]/30 text-[#adc6ff]'
              }`}>
                {voiceError || `VOICE TRANSPORT: ${voiceTransportState}`}
              </div>
              
              {keyboardMode && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendUserMessage(inputText);
                  }}
                  className="w-[90vw] max-w-lg bg-[#191b23] border border-white/20 rounded-2xl p-2 flex items-center gap-2 shadow-2xl mb-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Ask AURA about ${currentExpConfig.name}...`}
                    className="flex-1 bg-transparent border-none text-sm text-white px-3 focus:outline-none placeholder:text-[#8c909f]"
                  />
                  <button
                    type="submit"
                    className="bg-[#4d8eff] text-white p-2.5 rounded-xl hover:bg-[#005ac2] transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="flex items-center justify-center gap-4 bg-[#111622]/90 backdrop-blur-xl rounded-full px-6 py-3 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                
                <button
                  onClick={() => setKeyboardMode(!keyboardMode)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    keyboardMode
                      ? 'border-[#4d8eff] bg-[#4d8eff]/20 text-[#adc6ff]'
                      : 'border-white/10 text-[#c2c6d6] hover:text-white hover:border-white/30'
                  }`}
                  title="Toggle Text Input"
                >
                  <Keyboard className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleMic}
                  disabled={voiceTransportState !== 'AGENT READY'}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${
                    isListening
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_25px_rgba(16,185,129,0.6)] animate-pulse'
                      : 'bg-gradient-to-tr from-[#4d8eff] to-[#571bc1] shadow-[0_0_20px_rgba(173,198,255,0.4)]'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  title={voiceTransportState !== 'AGENT READY' ? "Connecting to AURA..." : isListening ? "Listening... Click to stop" : "Click to speak to AURA"}
                >
                  {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>

                <button
                  onClick={() => setActiveView('session-summary')}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-[#c2c6d6] hover:text-white hover:border-white/30 transition-all"
                  title="Finish & View Summary"
                >
                  <StopCircle className="w-5 h-5" />
                </button>

              </div>
            </div>

          </div>

          {/* Right Panel: Dynamic Context Engine & Qdrant Retrieval */}
          <div className="w-full lg:w-1/4 bg-[#111622]/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col gap-4 relative shadow-2xl overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-xs text-[#c2c6d6] uppercase tracking-widest font-semibold">
                Context Engine
              </h3>
              <Memory className="w-4 h-4 text-[#adc6ff]" />
            </div>

            {/* Experience Context Details */}
            <div className="flex flex-col gap-2.5">
              <div className="bg-[#1d1f27]/80 rounded-xl p-3 border border-white/10">
                <span className="font-mono text-[10px] text-[#adc6ff] block mb-1 uppercase font-semibold">
                  CURRENT TASK
                </span>
                <span className="text-sm font-bold text-white">
                  {currentExpConfig.contextCard.task}
                </span>
              </div>

              <div className="bg-[#1d1f27]/60 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs text-[#c2c6d6]">
                <div>• {currentExpConfig.contextCard.primaryContext}</div>
                <div>• {currentExpConfig.contextCard.secondaryContext}</div>
                <div>• {currentExpConfig.contextCard.relevantData}</div>
              </div>

              <div className="bg-[#10131a] p-3 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="font-mono text-[10px] text-[#c2c6d6] uppercase">Suggested Action</span>
                <span className="font-mono text-[10px] text-[#adc6ff] font-bold">
                  {currentExpConfig.contextCard.suggestedAction}
                </span>
              </div>
            </div>

            {/* Qdrant Memory Visualization */}
            <div className="mt-2 flex-1">
              <h4 className="font-mono text-xs text-[#c2c6d6] mb-3 flex items-center gap-1.5 uppercase font-semibold">
                <Database className="w-3.5 h-3.5 text-[#adc6ff]" />
                Qdrant Retrieval
              </h4>

              <div className="flex flex-col gap-2.5">
                {currentExpConfig.memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="bg-[#0a0d14] border border-white/10 rounded-xl p-3 flex items-start gap-2.5 hover:border-[#adc6ff]/40 transition-all"
                  >
                    <div className={`w-1 h-full rounded-full ${
                      mem.color === 'primary' ? 'bg-[#4d8eff]' : mem.color === 'secondary' ? 'bg-[#d0bcff]' : 'bg-[#89ceff]'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-mono text-[10px] font-bold ${
                          mem.color === 'primary' ? 'text-[#adc6ff]' : mem.color === 'secondary' ? 'text-[#d0bcff]' : 'text-[#89ceff]'
                        }`}>
                          {mem.code}
                        </span>
                        <span className="text-[9px] font-mono text-[#c2c6d6]/60 uppercase">
                          {mem.source}
                        </span>
                      </div>
                      <p className="text-xs text-[#c2c6d6] leading-snug">{mem.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveView('session-summary')}
              className="mt-auto w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-[#adc6ff] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Complete & Summarize
            </button>

          </div>

        </div>
      </main>

    </div>
  );
};
