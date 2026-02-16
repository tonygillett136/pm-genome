import { useState } from 'react';
import type { QuizQuestion } from '../../lib/scoring';

interface Props {
  question: QuizQuestion;
  questionIndex: number;
  selectedOption: number | undefined;
  onSelect: (optionIndex: number) => void;
}

export default function QuestionCard({ question, questionIndex, selectedOption, onSelect }: Props) {
  const [selecting, setSelecting] = useState<number | null>(null);

  function handleSelect(optionIndex: number) {
    if (selecting !== null) return;
    setSelecting(optionIndex);
    // Brief delay for visual feedback before advancing
    setTimeout(() => {
      onSelect(optionIndex);
      setSelecting(null);
    }, 200);
  }

  return (
    <div className="animate-fadeIn">
      <p className="mb-8 text-xl font-medium leading-relaxed md:text-2xl">
        {question.scenario}
      </p>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          const isSelected = selecting === i || (selecting === null && selectedOption === i);
          const letter = String.fromCharCode(65 + i); // A, B, C, D

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(i)}
              className={`group w-full rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? 'border-[#6366F1] bg-[#6366F1]/10'
                  : 'border-[#2A2A3A] bg-[#1A1A23] hover:border-[#6366F1]/50 hover:bg-[#24243A]'
              }`}
            >
              <div className="flex gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[#2A2A3A] text-[#9CA3AF] group-hover:bg-[#6366F1]/30 group-hover:text-[#F0F0F5]'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-base leading-relaxed">{option.text}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
