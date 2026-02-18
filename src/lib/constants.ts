export const DIMENSIONS = [
  {
    id: 'strategic-vision',
    name: 'Strategic Vision',
    shortName: 'Vision',
    description: 'Setting direction, first-principles thinking, long-term bets, market positioning',
    color: '#6366F1',
  },
  {
    id: 'execution-craft',
    name: 'Execution & Craft',
    shortName: 'Craft',
    description: 'Shipping velocity, quality obsession, design excellence, attention to detail',
    color: '#F59E0B',
  },
  {
    id: 'data-experimentation',
    name: 'Data & Experimentation',
    shortName: 'Data',
    description: 'Measurement rigor, A/B testing, evidence-based decisions, metrics frameworks',
    color: '#10B981',
  },
  {
    id: 'growth-distribution',
    name: 'Growth & Distribution',
    shortName: 'Growth',
    description: 'Growth loops, PLG, viral mechanics, channels, acquisition strategy',
    color: '#EF4444',
  },
  {
    id: 'team-leadership',
    name: 'Team & Leadership',
    shortName: 'Team',
    description: 'Hiring, culture, coaching, org design, managing up and across',
    color: '#8B5CF6',
  },
  {
    id: 'user-empathy',
    name: 'User Empathy & Research',
    shortName: 'Empathy',
    description: 'Customer obsession, user research, design thinking, jobs-to-be-done',
    color: '#EC4899',
  },
] as const;

export type DimensionId = (typeof DIMENSIONS)[number]['id'];

export const DIMENSION_IDS = DIMENSIONS.map((d) => d.id);

export const BASE_PATH = '/pm-genome';
