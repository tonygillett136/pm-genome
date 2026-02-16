/**
 * Quiz state management with nanostores.
 * Persists to localStorage for resume-on-reload.
 */
import { map, atom } from 'nanostores';

const STORAGE_KEY = 'pm-genome-quiz';

/** Map of questionIndex → selectedOptionIndex */
export const $answers = map<Record<number, number>>({});

/** Current question index (0-23) */
export const $currentQuestion = atom(0);

/** Quiz state: 'intro' | 'active' | 'complete' */
export const $quizState = atom<'intro' | 'active' | 'complete'>('intro');

/** Load saved state from localStorage */
export function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.answers) $answers.set(parsed.answers);
      if (typeof parsed.currentQuestion === 'number') $currentQuestion.set(parsed.currentQuestion);
      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        $quizState.set('active');
      }
    }
  } catch { /* ignore */ }
}

/** Save current state to localStorage */
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: $answers.get(),
      currentQuestion: $currentQuestion.get(),
    }));
  } catch { /* ignore */ }
}

/** Record an answer and advance */
export function answerQuestion(questionIndex: number, optionIndex: number, totalQuestions: number) {
  $answers.setKey(String(questionIndex) as any, optionIndex);
  saveState();

  if (questionIndex < totalQuestions - 1) {
    $currentQuestion.set(questionIndex + 1);
    saveState();
  } else {
    $quizState.set('complete');
  }
}

/** Go back one question */
export function goBack() {
  const current = $currentQuestion.get();
  if (current > 0) {
    $currentQuestion.set(current - 1);
    saveState();
  }
}

/** Reset quiz to start */
export function resetQuiz() {
  $answers.set({});
  $currentQuestion.set(0);
  $quizState.set('intro');
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/** Start the quiz */
export function startQuiz() {
  $quizState.set('active');
}
