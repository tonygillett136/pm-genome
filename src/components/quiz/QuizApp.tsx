import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $answers,
  $currentQuestion,
  $quizState,
  loadSavedState,
  startQuiz,
  answerQuestion,
  goBack,
  resetQuiz,
} from '../../stores/quiz';
import { computeScores } from '../../lib/scoring';
import { encodeAnswers } from '../../lib/sharing';
import type { QuizData } from '../../lib/scoring';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';

interface Props {
  quizData: QuizData;
}

export default function QuizApp({ quizData }: Props) {
  const state = useStore($quizState);
  const current = useStore($currentQuestion);
  const answers = useStore($answers);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    loadSavedState();
  }, []);

  // When complete, compute scores and redirect
  useEffect(() => {
    if (state === 'complete') {
      setAnimating(true);
      const timer = setTimeout(() => {
        const scores = computeScores(answers, quizData.questions);
        const encoded = encodeAnswers(answers, quizData.questions.length);
        window.location.href = `/pm-genome/results?s=${encoded}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (animating) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-[#2A2A3A] border-t-[#6366F1]" />
        <p className="text-xl font-semibold">Calculating your PM Genome...</p>
        <p className="mt-2 text-[#9CA3AF]">Matching against 280+ leaders</p>
      </div>
    );
  }

  if (state === 'intro') {
    const hasProgress = Object.keys(answers).length > 0;
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mb-6 text-6xl">🧬</div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
          Product Leadership Assessment
        </h1>
        <p className="mb-2 text-lg text-[#9CA3AF]">
          24 scenarios. ~8 minutes. No wrong answers.
        </p>
        <p className="mb-10 text-sm text-[#9CA3AF]">
          Each question presents a realistic product situation. Pick the response
          that feels most natural to you — not what you think is "right."
        </p>
        <button
          onClick={startQuiz}
          className="rounded-xl bg-[#6366F1] px-10 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
        >
          {hasProgress ? 'Continue Assessment' : 'Start Assessment'}
        </button>
        {hasProgress && (
          <button
            onClick={() => { resetQuiz(); startQuiz(); }}
            className="mt-4 block mx-auto text-sm text-[#9CA3AF] underline hover:text-[#F0F0F5]"
          >
            Start over
          </button>
        )}
      </div>
    );
  }

  const question = quizData.questions[current];
  if (!question) return null;

  const tierLabels = ['', 'The Daily Grind', 'The Hard Tradeoffs', 'The Defining Moments'];
  const tierLabel = tierLabels[question.tier] || '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ProgressBar current={current} total={quizData.questions.length} />

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={current === 0}
          className="text-sm text-[#9CA3AF] transition-colors hover:text-[#F0F0F5] disabled:opacity-30 disabled:hover:text-[#9CA3AF]"
        >
          ← Back
        </button>
        {tierLabel && (
          <span className="text-xs font-medium uppercase tracking-widest text-[#9CA3AF]">
            {tierLabel}
          </span>
        )}
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        questionIndex={current}
        selectedOption={answers[current]}
        onSelect={(optionIndex) =>
          answerQuestion(current, optionIndex, quizData.questions.length)
        }
      />
    </div>
  );
}
