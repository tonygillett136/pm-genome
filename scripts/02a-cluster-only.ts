/**
 * Step 2a: Run clustering only (no API call).
 * Outputs cluster data for manual archetype characterization.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const EXTRACTED_DIR = resolve(import.meta.dirname, 'extracted');
const NORMALIZED_DIR = resolve(import.meta.dirname, 'normalized');
const OUTPUT_DIR = resolve(import.meta.dirname, '../src/data');

const K = 7;
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
  notableQuotes: Array<{ text?: string; quote?: string; context: string }>;
  episodeSummary: string;
}

interface LeaderProfile {
  slug: string;
  guestSlug: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  scores: number[];
  themes: string[];
  appearances: number;
}

function kmeans(data: number[][], k: number, maxIter = 100) {
  const dim = data[0].length;
  const centroids: number[][] = [];

  // k-means++ init
  centroids.push([...data[Math.floor(Math.random() * data.length)]]);
  for (let i = 1; i < k; i++) {
    const distances = data.map((point) => {
      const minDist = Math.min(...centroids.map((c) => euclideanDist(point, c)));
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
    const newAssignments = data.map((point) => {
      let minDist = Infinity, minIdx = 0;
      for (let i = 0; i < k; i++) {
        const dist = euclideanDist(point, centroids[i]);
        if (dist < minDist) { minDist = dist; minIdx = i; }
      }
      return minIdx;
    });
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) break;
    assignments = newAssignments;
    for (let i = 0; i < k; i++) {
      const members = data.filter((_, j) => assignments[j] === i);
      if (members.length === 0) continue;
      for (let d = 0; d < dim; d++) {
        centroids[i][d] = members.reduce((sum, m) => sum + m[d], 0) / members.length;
      }
    }
  }
  return { centroids, assignments };
}

function euclideanDist(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = readdirSync(EXTRACTED_DIR).filter(
    (f) => f.endsWith('.json') && !f.startsWith('_'),
  );
  console.log(`Loading ${files.length} extracted transcripts...`);

  const manifest = JSON.parse(
    readFileSync(join(NORMALIZED_DIR, '_manifest.json'), 'utf-8'),
  ) as Array<{ slug: string; guestSlug: string; appearanceNumber: number }>;
  const manifestBySlug = new Map(manifest.map((m) => [m.slug, m]));

  // Aggregate by guest
  const guestData = new Map<string, { profiles: Array<{ data: ExtractedData; appearance: number; slug: string }> }>();

  for (const file of files) {
    const slug = file.replace('.json', '');
    const data: ExtractedData = JSON.parse(readFileSync(join(EXTRACTED_DIR, file), 'utf-8'));
    const manifestEntry = manifestBySlug.get(slug);
    const guestSlug = manifestEntry?.guestSlug ?? slug;
    const appearance = manifestEntry?.appearanceNumber ?? 1;
    if (!guestData.has(guestSlug)) guestData.set(guestSlug, { profiles: [] });
    guestData.get(guestSlug)!.profiles.push({ data, appearance, slug });
  }

  console.log(`Aggregated into ${guestData.size} unique leaders`);

  // Build leader profiles
  const leaders: LeaderProfile[] = [];
  for (const [guestSlug, { profiles }] of guestData) {
    profiles.sort((a, b) => a.appearance - b.appearance);
    const weights = profiles.map((p, i) => i === profiles.length - 1 ? 1.5 : 1.0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const avgScores = DIMENSION_IDS.map((dimId) => {
      const weightedSum = profiles.reduce((sum, p, i) => {
        const score = p.data.dimensionScores?.[dimId] ?? 0.5;
        return sum + score * weights[i];
      }, 0);
      return Math.round((weightedSum / totalWeight) * 100) / 100;
    });
    const latest = profiles[profiles.length - 1].data;
    const allThemes = [...new Set(profiles.flatMap((p) => p.data.keyThemes ?? []))];
    leaders.push({
      slug: profiles[0].slug,
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

  // Run k-means
  console.log(`\nRunning k-means clustering (k=${K})...`);
  const dataPoints = leaders.map((l) => l.scores);

  let bestResult = kmeans(dataPoints, K);
  let bestDist = Infinity;
  for (let i = 0; i < 50; i++) {
    const result = kmeans(dataPoints, K);
    const totalDist = result.assignments.reduce(
      (sum, a, j) => sum + euclideanDist(dataPoints[j], result.centroids[a]), 0,
    );
    if (totalDist < bestDist) { bestDist = totalDist; bestResult = result; }
  }

  const { centroids, assignments } = bestResult;

  // Report clusters
  console.log('\n=== CLUSTER ANALYSIS ===\n');
  for (let i = 0; i < K; i++) {
    const members = leaders.filter((_, j) => assignments[j] === i);
    const centroid = centroids[i];
    const topDimIdx = centroid.indexOf(Math.max(...centroid));
    const topDim = DIMENSION_IDS[topDimIdx];

    console.log(`--- Cluster ${i}: ${members.length} leaders ---`);
    console.log(`Centroid: ${DIMENSION_IDS.map((id, d) => `${id}: ${centroid[d].toFixed(2)}`).join(', ')}`);
    console.log(`Top dimension: ${topDim}`);
    console.log(`Top members:`);

    // Sort by distance to centroid
    const sorted = members
      .map((l) => ({ leader: l, dist: euclideanDist(l.scores, centroid) }))
      .sort((a, b) => a.dist - b.dist);

    for (const s of sorted.slice(0, 8)) {
      console.log(`  ${s.leader.name} (${s.leader.title} at ${s.leader.company}) — themes: ${s.leader.themes.slice(0, 3).join(', ')}`);
    }
    console.log('');
  }

  // Save clustering data
  const clusteringData = {
    leaders: leaders.map((l, i) => ({ ...l, clusterIndex: assignments[i] })),
    centroids: centroids.map((c) => Object.fromEntries(DIMENSION_IDS.map((id, d) => [id, c[d]]))),
  };

  writeFileSync(join(EXTRACTED_DIR, '_clustering.json'), JSON.stringify(clusteringData, null, 2));
  console.log(`Clustering data saved to ${join(EXTRACTED_DIR, '_clustering.json')}`);
}

main();
