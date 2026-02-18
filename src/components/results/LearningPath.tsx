import { useState } from 'react';
import type { DimensionId } from '../../lib/constants';

interface Episode {
  leaderId: string;
  leaderName: string;
  title: string;
  company: string;
  whyListen: string;
  keyTakeaway: string;
  topQuote: string | null;
}

interface PathData {
  id: string;
  name: string;
  type: 'strengthen' | 'develop';
  targetDimension: string;
  description: string;
  episodes: Episode[];
}

interface Props {
  topDimensions: DimensionId[];
  bottomDimensions: DimensionId[];
  paths: PathData[];
}

export default function LearningPath({ topDimensions, bottomDimensions, paths }: Props) {
  const [activeTab, setActiveTab] = useState<'strengthen' | 'develop'>('strengthen');

  const strengthenPaths = paths.filter(
    (p) => p.type === 'strengthen' && topDimensions.includes(p.targetDimension as DimensionId),
  );
  const developPaths = paths.filter(
    (p) => p.type === 'develop' && bottomDimensions.includes(p.targetDimension as DimensionId),
  );

  const activePaths = activeTab === 'strengthen' ? strengthenPaths : developPaths;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Your Learning Path</h2>
      <p className="mb-6 text-[#9CA3AF]">
        Curated episodes from Lenny's Podcast to level up your product leadership.
      </p>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('strengthen')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'strengthen'
              ? 'bg-[#6366F1] text-white'
              : 'bg-[#1A1A23] text-[#9CA3AF] hover:text-[#F0F0F5]'
          }`}
        >
          Double down on strengths
        </button>
        <button
          onClick={() => setActiveTab('develop')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'develop'
              ? 'bg-[#6366F1] text-white'
              : 'bg-[#1A1A23] text-[#9CA3AF] hover:text-[#F0F0F5]'
          }`}
        >
          Shore up blind spots
        </button>
      </div>

      {/* Path content */}
      <div className="space-y-6">
        {activePaths.map((path) => (
          <div key={path.id}>
            <h3 className="mb-2 font-semibold">{path.name}</h3>
            <p className="mb-4 text-sm text-[#9CA3AF]">{path.description}</p>
            <div className="space-y-3">
              {path.episodes.map((ep, i) => (
                <div
                  key={`${ep.leaderId}-${i}`}
                  className="rounded-xl border border-[#2A2A3A] bg-[#1A1A23] p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2A2A3A] text-xs font-bold text-[#9CA3AF]">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="font-medium">
                        <a
                          href={`/leaders/${ep.leaderId}`}
                          className="hover:text-[#6366F1]"
                        >
                          {ep.leaderName}
                        </a>
                      </h4>
                      <p className="text-sm text-[#9CA3AF]">
                        {ep.title}{ep.company ? ` at ${ep.company}` : ''}
                      </p>
                      {ep.whyListen && (
                        <p className="mt-2 text-sm">{ep.whyListen}</p>
                      )}
                      {ep.topQuote && (
                        <blockquote className="mt-2 border-l-2 border-[#2A2A3A] pl-3 text-sm italic text-[#9CA3AF]">
                          "{ep.topQuote}"
                        </blockquote>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {activePaths.length === 0 && (
          <p className="text-[#9CA3AF]">No learning paths available for this selection.</p>
        )}
      </div>
    </div>
  );
}
