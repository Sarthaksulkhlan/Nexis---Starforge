export type ActiveView = 'matrix-core' | 'active-session' | 'session-summary';

export type ExperienceType = 'food' | 'healthcare' | 'cooking';

export interface ChatMessage {
  id: string;
  sender: 'YOU' | 'AURA';
  text: string;
  timestamp: string;
  isAudioPlaying?: boolean;
}

export interface VectorMemoryItem {
  id: string;
  code: string;
  text: string;
  source: 'Context Analysis' | 'Historical Log' | 'Action taken' | 'Qdrant Retrieval';
  color: 'primary' | 'secondary' | 'tertiary';
  pinned?: boolean;
}

export interface Session {
  id: string;
  experience: ExperienceType;
  title: string;
  model: string;
  latency: string;
  status: 'LIVE' | 'COMPLETED' | 'IN_PROGRESS';
  createdAt: string;
  actionsTakenCount: number;
  memoriesUsedCount: number;
  timeElapsed: string;
  messages: ChatMessage[];
  memories: VectorMemoryItem[];
}

export type VoiceCoreState = 
  | 'CONNECTING'
  | 'AGENT_READY'
  | 'READY' 
  | 'LISTENING' 
  | 'THINKING' 
  | 'RETRIEVING CONTEXT' 
  | 'SPEAKING' 
  | 'INTERRUPTED' 
  | 'ERROR'
  | 'RECONNECTING';
