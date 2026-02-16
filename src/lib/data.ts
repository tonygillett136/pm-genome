/**
 * Safe data loading utilities.
 * Returns empty defaults if data files haven't been generated yet.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../data');

function loadJson(filename: string, fallback: any): any {
  const path = resolve(DATA_DIR, filename);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

export function loadArchetypes() {
  return loadJson('archetypes.json', { archetypes: [], dimensions: [] });
}

export function loadLeaders() {
  return loadJson('leaders.json', { leaders: [] });
}

export function loadQuiz() {
  return loadJson('quiz.json', { questions: [], meta: { totalQuestions: 0 } });
}

export function loadLearningPaths() {
  return loadJson('learning-paths.json', { paths: [] });
}
