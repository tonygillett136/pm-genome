import { DIMENSIONS } from '../../lib/constants';
import type { DimensionId } from '../../lib/constants';
import type { DimensionScores } from '../../lib/scoring';
import type { Leader } from '../../lib/matching';

interface Props {
  bottomDimensions: DimensionId[];
  scores: DimensionScores;
  leaders: Leader[];
}

export default function BlindSpots({ bottomDimensions, scores, leaders }: Props) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Your Blind Spots</h2>
      <p className="mb-6 text-[#9CA3AF]">
        These are the dimensions where you scored lowest. Understanding your blind spots
        is the first step to becoming a more complete product leader.
      </p>
      <div className="space-y-6">
        {bottomDimensions.map((dimId) => {
          const dim = DIMENSIONS.find((d) => d.id === dimId)!;
          const score = scores[dimId];

          // Find top leaders in this dimension
          const topInDim = [...leaders]
            .sort((a, b) => (b.dimensions[dimId] ?? 0) - (a.dimensions[dimId] ?? 0))
            .slice(0, 3);

          return (
            <div
              key={dimId}
              className="rounded-xl border border-[#2A2A3A] bg-[#1A1A23] p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: dim.color }}
                />
                <h3 className="font-semibold">{dim.name}</h3>
                <span className="text-sm text-[#9CA3AF]">
                  Your score: {Math.round(score * 100)}%
                </span>
              </div>
              <p className="mb-4 text-sm text-[#9CA3AF]">{dim.description}</p>

              <div className="mb-2 text-xs font-medium uppercase tracking-widest text-[#9CA3AF]">
                Learn from these leaders
              </div>
              <div className="flex flex-wrap gap-2">
                {topInDim.map((leader) => (
                  <a
                    key={leader.id}
                    href={`/pm-genome/leaders/${leader.slug}`}
                    className="rounded-lg border border-[#2A2A3A] px-3 py-1.5 text-sm transition-colors hover:border-[#6366F1]/50 hover:bg-[#24243A]"
                  >
                    {leader.name}
                    <span className="ml-1 text-[#9CA3AF]">
                      {Math.round((leader.dimensions[dimId] ?? 0) * 100)}%
                    </span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
