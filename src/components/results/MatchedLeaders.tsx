import type { LeaderMatch } from '../../lib/matching';
import { DIMENSIONS } from '../../lib/constants';

interface Props {
  matches: LeaderMatch[];
}

export default function MatchedLeaders({ matches }: Props) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Your Matched Leaders</h2>
      <p className="mb-6 text-[#9CA3AF]">
        These leaders from Lenny's Podcast have the most similar product DNA to yours.
      </p>
      <div className="space-y-4">
        {matches.map((match, i) => {
          const topDims = Object.entries(match.leader.dimensions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
          const quote = match.leader.notableQuotes?.[0];
          const quoteText = quote?.text || quote?.quote;

          return (
            <div
              key={match.leader.id}
              className="rounded-xl border border-[#2A2A3A] bg-[#1A1A23] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6366F1]/20 text-sm font-bold text-[#6366F1]">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{match.leader.name}</h3>
                      <p className="text-sm text-[#9CA3AF]">
                        {match.leader.title}
                        {match.leader.company ? ` at ${match.leader.company}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-[#6366F1]/10 px-3 py-1 text-sm font-medium text-[#6366F1]">
                  {Math.round(match.similarity * 100)}% match
                </span>
              </div>

              {/* Dimension bars */}
              <div className="mt-4 flex gap-1">
                {topDims.map(([dimId, score]) => {
                  const dim = DIMENSIONS.find((d) => d.id === dimId);
                  return (
                    <div key={dimId} className="flex-1">
                      <div className="mb-1 text-xs text-[#9CA3AF]">{dim?.shortName}</div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#2A2A3A]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(score as number) * 100}%`,
                            backgroundColor: dim?.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quote */}
              {quoteText && (
                <blockquote className="mt-4 border-l-2 border-[#2A2A3A] pl-4 text-sm italic text-[#9CA3AF]">
                  "{quoteText}"
                </blockquote>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
