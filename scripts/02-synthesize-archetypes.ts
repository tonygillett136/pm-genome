/**
 * Step 2: Synthesize archetypes from extracted leader data.
 *
 * 1. Loads all extracted leader data
 * 2. Aggregates dimension scores (averaging multi-appearances)
 * 3. Runs k-means clustering (k=7) on the 6D vectors
 * 4. Sends cluster data to Claude for naming/characterization
 * 5. Outputs archetypes.json
 *
 * Usage: npx tsx 02-synthesize-archetypes.ts
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const EXTRACTED_DIR = resolve(import.meta.dirname, 'extracted');
const NORMALIZED_DIR = resolve(import.meta.dirname, 'normalized');
const OUTPUT_DIR = resolve(import.meta.dirname, '../src/data');
const PROMPT_TEMPLATE = readFileSync(
  resolve(import.meta.dirname, 'prompts/synthesize.md'),
  'utf-8',
);

const K = 7; // Number of clusters/archetypes
const DIMENSION_IDS = [
  'strategic-vision',
  'execution-craft',
  'data-experimentation',
  'growth-distribution',
  'team-leadership',
  'user-empathy',
] as const;

type DimensionId = (typeof DIMENSION_IDS)[number];

interface ExtractedData {
  guestMeta: { name: string; title: string; company: string; bio: string };
  keyThemes: string[];
  leadershipPrinciples: string[];
  dimensionScores: Record<DimensionId, number>;
  notableQuotes: Array<{ text: string; context: string }>;
  episodeSummary: string;
}

interface LeaderProfile {
  slug: string;
  guestSlug: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  scores: number[]; // ordered by DIMENSION_IDS
  themes: string[];
  appearances: number;
}

/**
 * Simple k-means clustering implementation for 6D vectors.
 */
function kmeans(
  data: number[][],
  k: number,
  maxIter = 100,
): { centroids: number[][]; assignments: number[] } {
  const dim = data[0].length;

  // Initialize centroids using k-means++ style
  const centroids: number[][] = [];
  centroids.push([...data[Math.floor(Math.random() * data.length)]]);

  for (let i = 1; i < k; i++) {
    const distances = data.map((point) => {
      const minDist = Math.min(
        ...centroids.map((c) => euclideanDist(point, c)),
      );
      return minDist * minDist;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    for (let j = 0; j < data.length; j++) {
      r -= distances[j];
      if (r <= 0) {
        centroids.push([...data[j]]);
        break;
      }
    }
  }

  let assignments = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign each point to nearest centroid
    const newAssignments = data.map((point) => {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < k; i++) {
        const dist = euclideanDist(point, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      return minIdx;
    });

    // Check convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
      break;
    }
    assignments = newAssignments;

    // Update centroids
    for (let i = 0; i < k; i++) {
      const members = data.filter((_, j) => assignments[j] === i);
      if (members.length === 0) continue;
      for (let d = 0; d < dim; d++) {
        centroids[i][d] =
          members.reduce((sum, m) => sum + m[d], 0) / members.length;
      }
    }
  }

  return { centroids, assignments };
}

function euclideanDist(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load all extracted data
  const files = readdirSync(EXTRACTED_DIR).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.raw.txt'),
  );
  console.log(`Loading ${files.length} extracted transcripts...`);

  // Load normalized manifest for appearance info
  const manifest = JSON.parse(
    readFileSync(join(NORMALIZED_DIR, '_manifest.json'), 'utf-8'),
  ) as Array<{ slug: string; guestSlug: string; appearanceNumber: number }>;

  const manifestBySlug = new Map(manifest.map((m) => [m.slug, m]));

  // Aggregate by guest (average multi-appearances with recency weighting)
  const guestData = new Map<string, { profiles: Array<{ data: ExtractedData; appearance: number; slug: string }> }>();

  for (const file of files) {
    const slug = file.replace('.json', '');
    const data: ExtractedData = JSON.parse(
      readFileSync(join(EXTRACTED_DIR, file), 'utf-8'),
    );

    const manifestEntry = manifestBySlug.get(slug);
    const guestSlug = manifestEntry?.guestSlug ?? slug;
    const appearance = manifestEntry?.appearanceNumber ?? 1;

    if (!guestData.has(guestSlug)) {
      guestData.set(guestSlug, { profiles: [] });
    }
    guestData.get(guestSlug)!.profiles.push({ data, appearance, slug });
  }

  console.log(`Aggregated into ${guestData.size} unique leaders`);

  // Build leader profiles with weighted average scores
  const leaders: LeaderProfile[] = [];

  for (const [guestSlug, { profiles }] of guestData) {
    // Sort by appearance number, most recent gets 1.5x weight
    profiles.sort((a, b) => a.appearance - b.appearance);

    const weights = profiles.map((p, i) =>
      i === profiles.length - 1 ? 1.5 : 1.0,
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const avgScores = DIMENSION_IDS.map((dimId) => {
      const weightedSum = profiles.reduce((sum, p, i) => {
        const score = p.data.dimensionScores?.[dimId] ?? 0.5;
        return sum + score * weights[i];
      }, 0);
      return Math.round((weightedSum / totalWeight) * 100) / 100;
    });

    // Use the most recent profile for metadata
    const latest = profiles[profiles.length - 1].data;
    const allThemes = [...new Set(profiles.flatMap((p) => p.data.keyThemes ?? []))];

    leaders.push({
      slug: profiles[0].slug, // Use first appearance slug as canonical
      guestSlug,
      name: latest.guestMeta?.name ?? guestSlug,
      title: latest.guestMeta?.title ?? '',
      company: latest.guestMeta?.company ?? '',
      bio: latest.guestMeta?.bio ?? '',
      scores: avgScores,
      themes: allThemes.slice(0, 6),
      appearances: profiles.length,
    });
  }

  // Run k-means clustering
  console.log(`\nRunning k-means clustering (k=${K})...`);
  const dataPoints = leaders.map((l) => l.scores);

  // Run multiple times and pick best (lowest total distance)
  let bestResult = kmeans(dataPoints, K);
  let bestDist = Infinity;

  for (let i = 0; i < 20; i++) {
    const result = kmeans(dataPoints, K);
    const totalDist = result.assignments.reduce(
      (sum, a, j) => sum + euclideanDist(dataPoints[j], result.centroids[a]),
      0,
    );
    if (totalDist < bestDist) {
      bestDist = totalDist;
      bestResult = result;
    }
  }

  const { centroids, assignments } = bestResult;

  // Report cluster sizes
  for (let i = 0; i < K; i++) {
    const members = leaders.filter((_, j) => assignments[j] === i);
    const centroid = centroids[i];
    const topDim = DIMENSION_IDS[centroid.indexOf(Math.max(...centroid))];
    console.log(
      `  Cluster ${i}: ${members.length} leaders | top dimension: ${topDim} | centroid: [${centroid.map((v) => v.toFixed(2)).join(', ')}]`,
    );
  }

  // Build cluster summaries for Claude
  const clusterSummaries = centroids.map((centroid, i) => {
    const members = leaders
      .map((l, j) => ({ leader: l, idx: j }))
      .filter(({ idx }) => assignments[idx] === i)
      .sort((a, b) => {
        // Sort by total score (most distinctive members first)
        const aDist = euclideanDist(a.leader.scores, centroid);
        const bDist = euclideanDist(b.leader.scores, centroid);
        return aDist - bDist;
      });

    const representatives = members.slice(0, 8);

    return {
      clusterIndex: i,
      centroid: Object.fromEntries(
        DIMENSION_IDS.map((id, d) => [id, Math.round(centroid[d] * 100) / 100]),
      ),
      size: members.length,
      representatives: representatives.map((r) => ({
        name: r.leader.name,
        title: r.leader.title,
        company: r.leader.company,
        scores: Object.fromEntries(
          DIMENSION_IDS.map((id, d) => [id, r.leader.scores[d]]),
        ),
        themes: r.leader.themes.slice(0, 4),
      })),
    };
  });

  const clusterDataStr = clusterSummaries
    .map(
      (c) =>
        `### Cluster ${c.clusterIndex} (${c.size} leaders)\n` +
        `Centroid: ${JSON.stringify(c.centroid)}\n\n` +
        `Representatives:\n${c.representatives
          .map(
            (r) =>
              `- **${r.name}** (${r.title} at ${r.company}): scores=${JSON.stringify(r.scores)}, themes: ${r.themes.join(', ')}`,
          )
          .join('\n')}`,
    )
    .join('\n\n');

  // Send to Claude for naming/characterization
  console.log('\nSending cluster data to Claude for archetype synthesis...');

  let prompt = PROMPT_TEMPLATE;
  prompt = prompt.replaceAll('{{k}}', String(K));
  prompt = prompt.replace('{{clusterData}}', clusterDataStr);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = response.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  let archetypes;
  try {
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    archetypes = JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse Claude response as JSON. Raw response:');
    console.error(responseText);
    writeFileSync(join(OUTPUT_DIR, 'archetypes-raw.txt'), responseText);
    throw e;
  }

  // Build final archetypes.json with dimension definitions
  const archetypesJson = {
    version: '1.0.0',
    dimensions: DIMENSION_IDS.map((id) => {
      const labels: Record<string, { name: string; shortName: string; description: string; color: string }> = {
        'strategic-vision': { name: 'Strategic Vision', shortName: 'Vision', description: 'Setting direction, first-principles thinking, long-term bets, market positioning', color: '#6366F1' },
        'execution-craft': { name: 'Execution & Craft', shortName: 'Craft', description: 'Shipping velocity, quality obsession, design excellence, attention to detail', color: '#F59E0B' },
        'data-experimentation': { name: 'Data & Experimentation', shortName: 'Data', description: 'Measurement rigor, A/B testing, evidence-based decisions, metrics', color: '#10B981' },
        'growth-distribution': { name: 'Growth & Distribution', shortName: 'Growth', description: 'Growth loops, PLG, viral mechanics, channels, acquisition strategy', color: '#EF4444' },
        'team-leadership': { name: 'Team & Leadership', shortName: 'Team', description: 'Hiring, culture, coaching, org design, managing up and across', color: '#8B5CF6' },
        'user-empathy': { name: 'User Empathy & Research', shortName: 'Empathy', description: 'Customer obsession, user research, design thinking, jobs-to-be-done', color: '#EC4899' },
      };
      return { id, ...labels[id] };
    }),
    archetypes,
  };

  writeFileSync(
    join(OUTPUT_DIR, 'archetypes.json'),
    JSON.stringify(archetypesJson, null, 2),
  );

  // Also save the clustering data for the next step
  const clusteringData = {
    leaders: leaders.map((l, i) => ({
      ...l,
      clusterIndex: assignments[i],
    })),
    centroids: centroids.map((c) =>
      Object.fromEntries(DIMENSION_IDS.map((id, d) => [id, c[d]])),
    ),
  };

  writeFileSync(
    join(EXTRACTED_DIR, '_clustering.json'),
    JSON.stringify(clusteringData, null, 2),
  );

  console.log(`\nArchetypes written to ${join(OUTPUT_DIR, 'archetypes.json')}`);
  console.log(`Clustering data written to ${join(EXTRACTED_DIR, '_clustering.json')}`);
}

main().catch(console.error);
