import { useEffect, useState } from 'react';
import { computeScores, type QuizData, type DimensionScores } from '../../lib/scoring';
import {
  matchArchetypes,
  matchLeaders,
  rankDimensions,
  type Archetype,
  type Leader,
} from '../../lib/matching';
import { decodeAnswers, encodeAnswers } from '../../lib/sharing';
import { DIMENSIONS, type DimensionId } from '../../lib/constants';
import RadarChart from './RadarChart';
import MatchedLeaders from './MatchedLeaders';
import BlindSpots from './BlindSpots';
import LearningPath from './LearningPath';
import ShareCard from './ShareCard';

interface Props {
  quizData: QuizData;
  archetypesData: { archetypes: Archetype[] };
  leadersData: { leaders: Leader[] };
  learningPathsData: { paths: any[] };
}

export default function ResultsApp({
  quizData,
  archetypesData,
  leadersData,
  learningPathsData,
}: Props) {
  const [scores, setScores] = useState<DimensionScores | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try URL param first, then localStorage
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');

    let answers: Record<number, number> | null = null;

    if (encoded) {
      try {
        answers = decodeAnswers(encoded, quizData.questions.length);
      } catch {
        setError('Invalid share link. The quiz answers could not be decoded.');
        return;
      }
    } else {
      // Try localStorage
      try {
        const saved = localStorage.getItem('pm-genome-quiz');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.answers && Object.keys(parsed.answers).length > 0) {
            answers = parsed.answers;
          }
        }
      } catch { /* ignore */ }
    }

    if (!answers || Object.keys(answers).length < quizData.questions.length) {
      setError('No quiz results found. Take the assessment first!');
      return;
    }

    const computed = computeScores(answers, quizData.questions);
    setScores(computed);

    // Ensure URL has the encoded answers for sharing
    if (!encoded) {
      const enc = encodeAnswers(answers, quizData.questions.length);
      window.history.replaceState(null, '', `/results?s=${enc}`);
    }
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="mb-6 text-xl text-[#9CA3AF]">{error}</p>
        <a
          href="/quiz"
          className="rounded-xl bg-[#6366F1] px-8 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
        >
          Take the Assessment
        </a>
      </div>
    );
  }

  if (!scores) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2A2A3A] border-t-[#6366F1]" />
      </div>
    );
  }

  const archetypeMatches = matchArchetypes(scores, archetypesData.archetypes);
  const primary = archetypeMatches[0];
  const secondary = archetypeMatches[1]?.similarity > 0.65 ? archetypeMatches[1] : null;
  const leaderMatches = matchLeaders(scores, leadersData.leaders, 5);
  const { top: topDims, bottom: bottomDims } = rankDimensions(scores);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <section className="mb-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[#6366F1]">
          Your Product Leadership DNA
        </p>
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight">
          {primary.archetype.name}
        </h1>
        <p className="mb-4 text-xl text-[#9CA3AF]">{primary.archetype.tagline}</p>
        {secondary && (
          <p className="text-sm text-[#9CA3AF]">
            with a secondary lean toward{' '}
            <span className="font-medium text-[#F0F0F5]">{secondary.archetype.name}</span>
          </p>
        )}
      </section>

      {/* Radar Chart */}
      <section className="mb-16">
        <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A23] p-6">
          <RadarChart
            userScores={scores}
            archetypeScores={primary.archetype.dimensions}
            size={380}
          />
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-[#9CA3AF]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-[#EC4899]" /> You
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-[#6366F1] opacity-50" /> {primary.archetype.name} avg
            </span>
          </div>
        </div>
      </section>

      {/* Dimension Breakdown */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Your Dimension Scores</h2>
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const score = scores[dim.id];
            return (
              <div key={dim.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{dim.name}</span>
                  <span style={{ color: dim.color }}>{Math.round(score * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#2A2A3A]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${score * 100}%`,
                      backgroundColor: dim.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Archetype Deep Dive */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">About {primary.archetype.name}</h2>
        <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A23] p-6">
          <p className="mb-6 leading-relaxed text-[#9CA3AF]">{primary.archetype.description}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-[#10B981]">
                Strengths
              </h3>
              <ul className="space-y-2">
                {primary.archetype.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 text-[#10B981]">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-[#F59E0B]">
                Blind Spots
              </h3>
              <ul className="space-y-2">
                {primary.archetype.blindSpots.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 text-[#F59E0B]">!</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {primary.archetype.growthEdge && (
            <div className="mt-6 rounded-lg bg-[#24243A] p-4">
              <h3 className="mb-2 text-sm font-medium uppercase tracking-widest text-[#8B5CF6]">
                Growth Edge
              </h3>
              <p className="text-sm text-[#9CA3AF]">{primary.archetype.growthEdge}</p>
            </div>
          )}
        </div>
      </section>

      {/* Matched Leaders */}
      <section className="mb-16">
        <MatchedLeaders matches={leaderMatches} />
      </section>

      {/* Blind Spots */}
      <section className="mb-16">
        <BlindSpots
          bottomDimensions={bottomDims}
          scores={scores}
          leaders={leadersData.leaders}
        />
      </section>

      {/* Learning Path */}
      <section className="mb-16">
        <LearningPath
          topDimensions={topDims}
          bottomDimensions={bottomDims}
          paths={learningPathsData.paths}
        />
      </section>

      {/* Share */}
      <section className="mb-16">
        <ShareCard
          archetype={primary.archetype}
          scores={scores}
          shareUrl={shareUrl}
        />
      </section>

      {/* Retake CTA */}
      <section className="text-center">
        <a
          href="/quiz"
          className="text-sm text-[#9CA3AF] underline hover:text-[#F0F0F5]"
          onClick={() => {
            try { localStorage.removeItem('pm-genome-quiz'); } catch {}
          }}
        >
          Retake the assessment
        </a>
      </section>
    </div>
  );
}
