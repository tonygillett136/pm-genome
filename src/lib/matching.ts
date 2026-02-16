/**
 * Archetype and leader matching via cosine similarity.
 */
import { DIMENSION_IDS, type DimensionId } from './constants';
import type { DimensionScores } from './scoring';

export interface Archetype {
  id: string;
  name: string;
  tagline: string;
  description: string;
  strengths: string[];
  blindSpots: string[];
  growthEdge: string;
  dimensions: Record<DimensionId, number>;
}

export interface Leader {
  id: string;
  name: string;
  slug: string;
  title: string;
  company: string;
  bio: string;
  dimensions: Record<DimensionId, number>;
  primaryArchetype: string;
  secondaryArchetype: string | null;
  keyThemes: string[];
  notableQuotes: Array<{ text?: string; quote?: string; context: string }>;
  episodeSummary: string;
  leadershipPrinciples: string[];
}

export interface ArchetypeMatch {
  archetype: Archetype;
  similarity: number;
}

export interface LeaderMatch {
  leader: Leader;
  similarity: number;
}

function toVector(scores: Record<string, number>): number[] {
  return DIMENSION_IDS.map((id) => scores[id] ?? 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Match user scores against archetypes, returning sorted matches.
 */
export function matchArchetypes(
  userScores: DimensionScores,
  archetypes: Archetype[],
): ArchetypeMatch[] {
  const userVec = toVector(userScores);
  return archetypes
    .map((archetype) => ({
      archetype,
      similarity: Math.round(cosineSimilarity(userVec, toVector(archetype.dimensions)) * 100) / 100,
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Match user scores against leaders, returning top N matches.
 */
export function matchLeaders(
  userScores: DimensionScores,
  leaders: Leader[],
  topN = 5,
): LeaderMatch[] {
  const userVec = toVector(userScores);
  return leaders
    .map((leader) => ({
      leader,
      similarity: Math.round(cosineSimilarity(userVec, toVector(leader.dimensions)) * 100) / 100,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

/**
 * Get the user's top and bottom dimensions.
 */
export function rankDimensions(scores: DimensionScores): { top: DimensionId[]; bottom: DimensionId[] } {
  const sorted = (Object.entries(scores) as [DimensionId, number][])
    .sort((a, b) => b[1] - a[1]);
  return {
    top: sorted.slice(0, 2).map(([id]) => id),
    bottom: sorted.slice(-2).map(([id]) => id),
  };
}
