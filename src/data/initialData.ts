import { Session, VectorMemoryItem, ChatMessage } from '../types';

export const INITIAL_MEMORIES: VectorMemoryItem[] = [
  {
    id: 'mem-1',
    code: 'INC-1042',
    text: 'Previous disconnect event linked to DHCP lease expiration on main router.',
    source: 'Context Analysis',
    color: 'primary',
    pinned: true,
  },
  {
    id: 'mem-2',
    code: 'KB-017',
    text: 'Known firmware issue for ISP-provided gateway model causing intermittent drops.',
    source: 'Historical Log',
    color: 'secondary',
    pinned: true,
  },
  {
    id: 'mem-3',
    code: 'CASE-0971',
    text: 'User explicitly denied automatic firmware updates last Tuesday.',
    source: 'Action taken',
    color: 'tertiary',
    pinned: false,
  },
  {
    id: 'mem-4',
    code: 'CONFIG-088',
    text: 'User prefers static IP assignment for primary workstation.',
    source: 'Context Analysis',
    color: 'primary',
    pinned: false,
  },
  {
    id: 'mem-5',
    code: 'AUTH-204',
    text: 'Router password updated on last configuration (March 12).',
    source: 'Historical Log',
    color: 'secondary',
    pinned: false,
  },
  {
    id: 'mem-6',
    code: 'NET-402',
    text: 'Guest network disabled during troubleshooting.',
    source: 'Action taken',
    color: 'tertiary',
    pinned: false,
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'YOU',
    text: 'My Wi-Fi keeps disconnecting again.',
    timestamp: '10:42 AM'
  },
  {
    id: 'msg-2',
    sender: 'AURA',
    text: 'I remember the previous incident. Let me cross-reference the network logs with your recent router configuration changes.',
    timestamp: '10:42 AM'
  }
];

export const DEFAULT_SESSION: Session = {
  id: 'sess-active',
  experience: 'food',
  title: 'Food Order',
  model: 'AURA-v4.Turbo',
  latency: '24ms',
  status: 'LIVE',
  createdAt: '2026-08-10 10:40',
  actionsTakenCount: 2,
  memoriesUsedCount: 3,
  timeElapsed: '00:02:14',
  messages: INITIAL_MESSAGES,
  memories: INITIAL_MEMORIES.slice(0, 3)
};

export const ARCHIVED_SESSIONS: Session[] = [
  {
    id: 'sess-102',
    experience: 'healthcare',
    title: 'Healthcare Assistance',
    model: 'AURA-v4.Turbo',
    latency: '18ms',
    status: 'COMPLETED',
    createdAt: '2026-08-09 14:20',
    actionsTakenCount: 4,
    memoriesUsedCount: 5,
    timeElapsed: '00:15:30',
    messages: [
      { id: 'm1', sender: 'YOU', text: 'Latency spikes on DNS queries to 8.8.8.8.', timestamp: '2:20 PM' },
      { id: 'm2', sender: 'AURA', text: 'Switched secondary fallback DNS to Cloudflare 1.1.1.1 and flushed local cache.', timestamp: '2:21 PM' }
    ],
    memories: [
      { id: 'm-x1', code: 'DNS-019', text: 'Cloudflare DNS configured as secondary resolver.', source: 'Action taken', color: 'primary' }
    ]
  },
  {
    id: 'sess-101',
    experience: 'cooking',
    title: 'Cooking Assistance',
    model: 'AURA-v4.Turbo',
    latency: '31ms',
    status: 'COMPLETED',
    createdAt: '2026-08-08 09:15',
    actionsTakenCount: 3,
    memoriesUsedCount: 2,
    timeElapsed: '00:45:12',
    messages: [
      { id: 'm3', sender: 'YOU', text: 'OAuth token endpoint returning 401 unauthorized.', timestamp: '9:15 AM' },
      { id: 'm4', sender: 'AURA', text: 'Refreshed client secrets and re-verified redirect URI mismatch in config.', timestamp: '9:16 AM' }
    ],
    memories: [
      { id: 'm-x2', code: 'AUTH-101', text: 'Redirect URI updated to Cloud Run container ingress.', source: 'Context Analysis', color: 'secondary' }
    ]
  }
];
