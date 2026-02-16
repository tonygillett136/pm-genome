/**
 * Step 3: Score each leader against the finalized archetypes.
 *
 * - Computes cosine similarity between each leader and each archetype centroid
 * - Assigns primary + secondary archetype
 * - Generates learning paths
 * - Outputs leaders.json and learning-paths.json
 *
 * Usage: npx tsx 03-score-leaders.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const EXTRACTED_DIR = resolve(import.meta.dirname, 'extracted');
const NORMALIZED_DIR = resolve(import.meta.dirname, 'normalized');
const OUTPUT_DIR = resolve(import.meta.dirname, '../src/data');

const DIMENSION_IDS = [
  'strategic-vision',
  'execution-craft',
  'data-experimentation',
  'growth-distribution',
  'team-leadership',
  'user-empathy',
] as const;

type DimensionId = (typeof DIMENSION_IDS)[number];

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

function main() {
  // Load archetypes
  const archetypesJson = JSON.parse(
    readFileSync(join(OUTPUT_DIR, 'archetypes.json'), 'utf-8'),
  );
  const archetypes: Array<{
    id: string;
    name: string;
    dimensions: Record<DimensionId, number>;
  }> = archetypesJson.archetypes;

  // Load clustering data (has aggregated leader profiles)
  const clusteringData = JSON.parse(
    readFileSync(join(EXTRACTED_DIR, '_clustering.json'), 'utf-8'),
  );

  // Load all extracted data for quotes/themes
  const extractedFiles = readdirSync(EXTRACTED_DIR).filter(
    (f) => f.endsWith('.json') && !f.startsWith('_'),
  );
  const extractedBySlug = new Map<string, any>();
  for (const file of extractedFiles) {
    const slug = file.replace('.json', '');
    extractedBySlug.set(
      slug,
      JSON.parse(readFileSync(join(EXTRACTED_DIR, file), 'utf-8')),
    );
  }

  // Load normalized manifest for appearance/filename info
  const manifest = JSON.parse(
    readFileSync(join(NORMALIZED_DIR, '_manifest.json'), 'utf-8'),
  );
  const manifestBySlug = new Map(manifest.map((m: any) => [m.slug, m]));

  // Build archetype centroid vectors
  const archetypeCentroids = archetypes.map((a) =>
    DIMENSION_IDS.map((id) => a.dimensions[id] ?? 0.5),
  );

  // Score each leader
  const leaders = clusteringData.leaders.map((leader: any) => {
    const scores = leader.scores as number[];

    // Compute archetype match scores
    const archetypeScores: Record<string, number> = {};
    for (let i = 0; i < archetypes.length; i++) {
      archetypeScores[archetypes[i].id] = Math.round(
        cosineSimilarity(scores, archetypeCentroids[i]) * 100,
      ) / 100;
    }

    // Sort by score to get primary/secondary
    const sorted = Object.entries(archetypeScores).sort(
      (a, b) => b[1] - a[1],
    );
    const primaryArchetype = sorted[0][0];
    const secondaryArchetype =
      sorted[1][1] > 0.65 ? sorted[1][0] : null;

    // Get extracted data for quotes
    const extracted = extractedBySlug.get(leader.slug);
    const manifestEntry = manifestBySlug.get(leader.slug);

    // Build dimension scores object
    const dimensionScores: Record<string, number> = {};
    DIMENSION_IDS.forEach((id, i) => {
      dimensionScores[id] = scores[i];
    });

    return {
      id: leader.guestSlug,
      name: leader.name,
      slug: leader.guestSlug,
      title: leader.title,
      company: leader.company,
      bio: leader.bio,
      appearances: leader.appearances,
      dimensions: dimensionScores,
      primaryArchetype,
      secondaryArchetype,
      archetypeScores,
      keyThemes: leader.themes,
      notableQuotes: extracted?.notableQuotes?.slice(0, 3) ?? [],
      episodeSummary: extracted?.episodeSummary ?? '',
      leadershipPrinciples: extracted?.leadershipPrinciples?.slice(0, 3) ?? [],
      transcriptFile: manifestEntry?.filename ?? null,
    };
  });

  // Deduplicate by guestSlug (keep most data-rich entry)
  const uniqueLeaders = new Map<string, any>();
  for (const leader of leaders) {
    const existing = uniqueLeaders.get(leader.slug);
    if (!existing || leader.appearances > existing.appearances) {
      uniqueLeaders.set(leader.slug, leader);
    }
  }

  const finalLeaders = [...uniqueLeaders.values()];

  // Build learning paths
  const learningPaths = buildLearningPaths(finalLeaders, archetypes);

  // Write outputs
  const leadersJson = {
    version: '1.0.0',
    leaders: finalLeaders,
  };

  writeFileSync(
    join(OUTPUT_DIR, 'leaders.json'),
    JSON.stringify(leadersJson, null, 2),
  );

  writeFileSync(
    join(OUTPUT_DIR, 'learning-paths.json'),
    JSON.stringify({ version: '1.0.0', paths: learningPaths }, null, 2),
  );

  console.log(`Leaders written: ${finalLeaders.length}`);
  console.log(`Learning paths written: ${learningPaths.length}`);

  // Summary stats
  for (const archetype of archetypes) {
    const count = finalLeaders.filter(
      (l) => l.primaryArchetype === archetype.id,
    ).length;
    console.log(`  ${archetype.name}: ${count} leaders`);
  }
}

function buildLearningPaths(
  leaders: any[],
  archetypes: any[],
): any[] {
  const paths: any[] = [];

  for (const dim of DIMENSION_IDS) {
    // "Strengthen" path: top leaders in this dimension
    const topInDim = [...leaders]
      .sort((a, b) => (b.dimensions[dim] ?? 0) - (a.dimensions[dim] ?? 0))
      .slice(0, 6);

    const dimLabel: Record<string, string> = {
      'strategic-vision': 'Strategic Vision',
      'execution-craft': 'Execution & Craft',
      'data-experimentation': 'Data & Experimentation',
      'growth-distribution': 'Growth & Distribution',
      'team-leadership': 'Team & Leadership',
      'user-empathy': 'User Empathy',
    };

    paths.push({
      id: `strengthen-${dim}`,
      name: `Master ${dimLabel[dim]}`,
      type: 'strengthen',
      targetDimension: dim,
      description: `Learn from leaders who score highest on ${dimLabel[dim]}.`,
      episodes: topInDim.map((l) => ({
        leaderId: l.id,
        leaderName: l.name,
        title: l.title,
        company: l.company,
        whyListen: l.episodeSummary || `${l.name} is a top scorer in ${dimLabel[dim]}.`,
        keyTakeaway: l.leadershipPrinciples?.[0] ?? '',
        topQuote: l.notableQuotes?.[0]?.text ?? null,
      })),
    });

    // "Blind spot fix" path: same leaders, framed differently
    paths.push({
      id: `develop-${dim}`,
      name: `Develop Your ${dimLabel[dim]}`,
      type: 'develop',
      targetDimension: dim,
      description: `If ${dimLabel[dim]} is your blind spot, these episodes will rewire how you think about it.`,
      episodes: topInDim.slice(0, 5).map((l) => ({
        leaderId: l.id,
        leaderName: l.name,
        title: l.title,
        company: l.company,
        whyListen: l.episodeSummary || `${l.name} exemplifies strong ${dimLabel[dim]}.`,
        keyTakeaway: l.leadershipPrinciples?.[0] ?? '',
        topQuote: l.notableQuotes?.[0]?.text ?? null,
      })),
    });
  }

  return paths;
}

main();
