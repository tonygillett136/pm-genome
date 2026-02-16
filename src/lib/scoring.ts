/**
 * Quiz scoring engine.
 * Converts quiz answers into normalized dimension scores.
 */
import type { DimensionId } from './constants';

export interface QuizQuestion {
  id: string;
  scenario: string;
  tier: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  weights: Record<DimensionId, number>;
}

export interface QuizData {
  version: string;
  meta: { totalQuestions: number; questionsPerDimension: number; estimatedMinutes: number };
  questions: QuizQuestion[];
}

export interface DimensionScores {
  'strategic-vision': number;
  'execution-craft': number;
  'data-experimentation': number;
  'growth-distribution': number;
  'team-leadership': number;
  'user-empathy': number;
}

/**
 * Given quiz answers (question index → option index), compute normalized dimension scores.
 */
export function computeScores(
  answers: Record<number, number>,
  questions: QuizQuestion[],
): DimensionScores {
  const totals: DimensionScores = {
    'strategic-vision': 0,
    'execution-craft': 0,
    'data-experimentation': 0,
    'growth-distribution': 0,
    'team-leadership': 0,
    'user-empathy': 0,
  };

  const maxPossible: DimensionScores = { ...totals };

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Track max possible per dimension (best option for each)
    for (const dim of Object.keys(totals) as DimensionId[]) {
      const maxWeight = Math.max(...q.options.map((o) => o.weights[dim] ?? 0));
      maxPossible[dim] += maxWeight;
    }

    // Add selected option's weights
    if (answers[i] !== undefined) {
      const option = q.options[answers[i]];
      if (option) {
        for (const dim of Object.keys(totals) as DimensionId[]) {
          totals[dim] += option.weights[dim] ?? 0;
        }
      }
    }
  }

  // Normalize to 0-1
  const scores: DimensionScores = { ...totals };
  for (const dim of Object.keys(scores) as DimensionId[]) {
    scores[dim] = maxPossible[dim] > 0
      ? Math.round((totals[dim] / maxPossible[dim]) * 100) / 100
      : 0;
  }

  return scores;
}
