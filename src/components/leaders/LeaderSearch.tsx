import { useState, useMemo } from 'react';
import { DIMENSIONS } from '../../lib/constants';

interface Leader {
  id: string;
  name: string;
  slug: string;
  title: string;
  company: string;
  primaryArchetype: string;
  dimensions: Record<string, number>;
}

interface Archetype {
  id: string;
  name: string;
}

interface Props {
  leaders: Leader[];
  archetypes: Archetype[];
}

export default function LeaderSearch({ leaders, archetypes }: Props) {
  const [query, setQuery] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('');

  const filtered = useMemo(() => {
    let result = leaders;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.title?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q),
      );
    }
    if (selectedArchetype) {
      result = result.filter((l) => l.primaryArchetype === selectedArchetype);
    }
    return result;
  }, [leaders, query, selectedArchetype]);

  return (
    <div>
      {/* Search and filter */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search leaders..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-[#2A2A3A] bg-[#1A1A23] px-4 py-2.5 text-sm text-[#F0F0F5] placeholder-[#9CA3AF] outline-none focus:border-[#6366F1]"
        />
        <select
          value={selectedArchetype}
          onChange={(e) => setSelectedArchetype(e.target.value)}
          className="rounded-lg border border-[#2A2A3A] bg-[#1A1A23] px-4 py-2.5 text-sm text-[#F0F0F5] outline-none focus:border-[#6366F1]"
        >
          <option value="">All Archetypes</option>
          {archetypes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="mb-4 text-sm text-[#9CA3AF]">
        {filtered.length} leader{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((leader) => {
          const topDims = Object.entries(leader.dimensions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);
          const archetype = archetypes.find((a) => a.id === leader.primaryArchetype);

          return (
            <a
              key={leader.id}
              href={`/leaders/${leader.slug}`}
              className="group rounded-xl border border-[#2A2A3A] bg-[#1A1A23] p-4 transition-colors hover:border-[#24243A] hover:bg-[#24243A]"
            >
              <h3 className="font-medium group-hover:text-[#6366F1]">{leader.name}</h3>
              <p className="text-sm text-[#9CA3AF]">
                {leader.title}{leader.company ? ` at ${leader.company}` : ''}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {archetype && (
                  <span className="rounded bg-[#6366F1]/10 px-2 py-0.5 text-xs text-[#6366F1]">
                    {archetype.name}
                  </span>
                )}
                <span className="text-xs text-[#9CA3AF]">
                  {topDims.map(([id]) => {
                    const d = DIMENSIONS.find((dim) => dim.id === id);
                    return d?.shortName;
                  }).join(' · ')}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-[#9CA3AF]">No leaders match your search.</p>
      )}
    </div>
  );
}
