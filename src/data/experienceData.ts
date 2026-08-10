import { ExperienceType, VectorMemoryItem, ChatMessage } from '../types';

export interface ExperienceConfig {
  id: ExperienceType;
  name: string;
  badge: string;
  tag: string;
  iconName: string;
  taskTitle: string;
  description: string;
  contextCard: {
    task: string;
    primaryContext: string;
    secondaryContext: string;
    relevantData: string;
    suggestedAction: string;
    riskLevel?: string;
  };
  demoMessages: ChatMessage[];
  memories: VectorMemoryItem[];
}

export const EXPERIENCE_DATA: Record<ExperienceType, ExperienceConfig> = {
  food: {
    id: 'food',
    name: 'Food Ordering',
    badge: '🍕 Food Ordering',
    tag: 'VOICE ORDERING',
    iconName: 'Utensils',
    taskTitle: 'Food Order',
    description: 'Order food naturally through voice. AURA remembers preferences, retrieves menu context, and helps you complete your order.',
    contextCard: {
      task: 'Food Order',
      primaryContext: 'Previous preference: Spicy vegetarian',
      secondaryContext: 'Previous order: Large paneer pizza',
      relevantData: 'Menu: Veg pizza / Indian dishes',
      suggestedAction: 'Build order'
    },
    demoMessages: [
      {
        id: 'msg-f1',
        sender: 'YOU',
        text: 'I want something spicy for dinner.',
        timestamp: '10:42 AM'
      },
      {
        id: 'msg-f2',
        sender: 'AURA',
        text: 'I remember you usually prefer spicy vegetarian food. Would you like your usual paneer pizza?',
        timestamp: '10:42 AM'
      },
      {
        id: 'msg-f3',
        sender: 'YOU',
        text: 'Yes, but make it large.',
        timestamp: '10:43 AM'
      },
      {
        id: 'msg-f4',
        sender: 'AURA',
        text: "Got it. Large and spicy. I'll add that to your order.",
        timestamp: '10:43 AM'
      }
    ],
    memories: [
      {
        id: 'mem-f1',
        code: 'PREF-101',
        text: 'Spicy vegetarian preference',
        source: 'Context Analysis',
        color: 'primary',
        pinned: true
      },
      {
        id: 'mem-f2',
        code: 'HIST-204',
        text: 'Previous order: Large paneer pizza',
        source: 'Historical Log',
        color: 'secondary',
        pinned: true
      },
      {
        id: 'mem-f3',
        code: 'MENU-309',
        text: 'Relevant menu: Veg pizza / Indian dishes',
        source: 'Qdrant Retrieval',
        color: 'tertiary',
        pinned: false
      }
    ]
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    badge: '🩺 Healthcare',
    tag: 'HIGH TRUST',
    iconName: 'HeartPulse',
    taskTitle: 'Healthcare Assistance',
    description: 'Discuss healthcare-related tasks such as appointment assistance, basic administrative guidance, and safe escalation.',
    contextCard: {
      task: 'Appointment assistance',
      primaryContext: 'Task: Appointment assistance',
      secondaryContext: 'Relevant info: Appointment availability',
      relevantData: 'Risk: High trust',
      suggestedAction: 'Confirm before proceeding',
      riskLevel: 'HIGH TRUST'
    },
    demoMessages: [
      {
        id: 'msg-h1',
        sender: 'YOU',
        text: 'I need help with an appointment.',
        timestamp: '11:15 AM'
      },
      {
        id: 'msg-h2',
        sender: 'AURA',
        text: 'I can help with appointment-related tasks. What would you like to schedule?',
        timestamp: '11:15 AM'
      }
    ],
    memories: [
      {
        id: 'mem-h1',
        code: 'TASK-201',
        text: 'Task Memory: Previous appointment request',
        source: 'Context Analysis',
        color: 'primary',
        pinned: true
      },
      {
        id: 'mem-h2',
        code: 'CLINIC-108',
        text: 'Preferred clinic: Westside Medical Hub',
        source: 'Historical Log',
        color: 'secondary',
        pinned: true
      },
      {
        id: 'mem-h3',
        code: 'KNOW-014',
        text: 'Knowledge: Appointment scheduling procedure',
        source: 'Qdrant Retrieval',
        color: 'tertiary',
        pinned: false
      }
    ]
  },
  cooking: {
    id: 'cooking',
    name: 'Home Cooking',
    badge: '🍳 Home Cooking',
    tag: 'HANDS-FREE',
    iconName: 'ChefHat',
    taskTitle: 'Cooking Assistance',
    description: 'Cook hands-free with spoken recipes, step-by-step guidance, substitutions, and natural interruptions.',
    contextCard: {
      task: 'Cooking Assistance',
      primaryContext: 'Recipe: Paneer Butter Masala',
      secondaryContext: 'Step: Prepare the gravy',
      relevantData: 'Preference: Vegetarian',
      suggestedAction: 'Continue recipe'
    },
    demoMessages: [
      {
        id: 'msg-c1',
        sender: 'YOU',
        text: 'Help me make paneer butter masala.',
        timestamp: '01:20 PM'
      },
      {
        id: 'msg-c2',
        sender: 'AURA',
        text: "Absolutely. I'll guide you one step at a time. Tell me when you're ready for the next step.",
        timestamp: '01:20 PM'
      }
    ],
    memories: [
      {
        id: 'mem-c1',
        code: 'PREF-301',
        text: 'Preference: Vegetarian',
        source: 'Context Analysis',
        color: 'primary',
        pinned: true
      },
      {
        id: 'mem-c2',
        code: 'RECIPE-042',
        text: 'Recipe: Paneer Butter Masala',
        source: 'Qdrant Retrieval',
        color: 'secondary',
        pinned: true
      },
      {
        id: 'mem-c3',
        code: 'STEP-105',
        text: 'Previous step: Gravy preparation',
        source: 'Historical Log',
        color: 'tertiary',
        pinned: false
      }
    ]
  }
};
