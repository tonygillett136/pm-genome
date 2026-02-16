/**
 * 6-axis radar chart using Recharts.
 * Overlays user scores on archetype centroid.
 */
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { DIMENSIONS } from '../../lib/constants';
import type { DimensionScores } from '../../lib/scoring';

interface Props {
  userScores: DimensionScores;
  archetypeScores?: DimensionScores;
  size?: number;
}

export default function RadarChart({ userScores, archetypeScores, size = 400 }: Props) {
  const data = DIMENSIONS.map((dim) => ({
    dimension: dim.shortName,
    user: Math.round((userScores[dim.id] ?? 0) * 100),
    archetype: archetypeScores ? Math.round((archetypeScores[dim.id] ?? 0) * 100) : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
        <PolarGrid stroke="#2A2A3A" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
        />
        {archetypeScores && (
          <Radar
            name="Archetype"
            dataKey="archetype"
            stroke="#6366F1"
            fill="#6366F1"
            fillOpacity={0.1}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}
        <Radar
          name="You"
          dataKey="user"
          stroke="#EC4899"
          fill="#EC4899"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
