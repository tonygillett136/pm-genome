/**
 * Step 5: Validate all generated JSON data for integrity.
 *
 * Checks:
 * - All cross-references between files are valid
 * - Archetype/leader counts are reasonable
 * - Quiz questions have correct structure
 * - Learning paths reference valid leaders
 *
 * Usage: npx tsx 05-validate.ts
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, '../src/data');

const DIMENSION_IDS = [
  'strategic-vision',
  'execution-craft',
  'data-experimentation',
  'growth-distribution',
  'team-leadership',
  'user-empathy',
];

let errors = 0;
let warnings = 0;

function error(msg: string) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function warn(msg: string) {
  console.warn(`  WARN: ${msg}`);
  warnings++;
}

function check(condition: boolean, msg: string) {
  if (!condition) error(msg);
}

function main() {
  console.log('Validating PM Genome data...\n');

  // Load all data files
  let archetypesJson: any, leadersJson: any, quizJson: any, learningPathsJson: any;

  try {
    archetypesJson = JSON.parse(readFileSync(join(DATA_DIR, 'archetypes.json'), 'utf-8'));
    leadersJson = JSON.parse(readFileSync(join(DATA_DIR, 'leaders.json'), 'utf-8'));
    quizJson = JSON.parse(readFileSync(join(DATA_DIR, 'quiz.json'), 'utf-8'));
    learningPathsJson = JSON.parse(readFileSync(join(DATA_DIR, 'learning-paths.json'), 'utf-8'));
  } catch (e) {
    console.error('Failed to load data files:', (e as Error).message);
    process.exit(1);
  }

  // --- Archetypes ---
  console.log('1. Archetypes');
  const archetypes = archetypesJson.archetypes;
  check(Array.isArray(archetypes), 'archetypes should be an array');
  check(archetypes.length >= 5 && archetypes.length <= 10, `Archetype count ${archetypes.length} should be 5-10`);

  const archetypeIds = new Set(archetypes.map((a: any) => a.id));
  for (const a of archetypes) {
    check(typeof a.id === 'string' && a.id.length > 0, `Archetype missing id`);
    check(typeof a.name === 'string' && a.name.length > 0, `Archetype ${a.id} missing name`);
    check(typeof a.tagline === 'string', `Archetype ${a.id} missing tagline`);
    check(typeof a.description === 'string' && a.description.length > 50, `Archetype ${a.id} description too short`);
    check(Array.isArray(a.strengths) && a.strengths.length >= 2, `Archetype ${a.id} needs 2+ strengths`);
    check(Array.isArray(a.blindSpots) && a.blindSpots.length >= 2, `Archetype ${a.id} needs 2+ blind spots`);

    // Check dimension scores
    if (a.dimensions) {
      for (const dim of DIMENSION_IDS) {
        const val = a.dimensions[dim];
        if (typeof val !== 'number' || val < 0 || val > 1) {
          error(`Archetype ${a.id} dimension ${dim} = ${val} (should be 0-1)`);
        }
      }
    } else {
      error(`Archetype ${a.id} missing dimensions`);
    }
  }
  console.log(`  ${archetypes.length} archetypes, ${archetypeIds.size} unique IDs\n`);

  // --- Leaders ---
  console.log('2. Leaders');
  const leaders = leadersJson.leaders;
  check(Array.isArray(leaders), 'leaders should be an array');
  check(leaders.length >= 200, `Leader count ${leaders.length} seems low (expected 200+)`);

  const leaderIds = new Set<string>();
  for (const l of leaders) {
    check(typeof l.id === 'string', `Leader missing id`);
    check(typeof l.name === 'string', `Leader ${l.id} missing name`);

    if (leaderIds.has(l.id)) {
      warn(`Duplicate leader id: ${l.id}`);
    }
    leaderIds.add(l.id);

    // Check archetype reference
    if (!archetypeIds.has(l.primaryArchetype)) {
      error(`Leader ${l.id} has invalid primaryArchetype: ${l.primaryArchetype}`);
    }
    if (l.secondaryArchetype && !archetypeIds.has(l.secondaryArchetype)) {
      error(`Leader ${l.id} has invalid secondaryArchetype: ${l.secondaryArchetype}`);
    }

    // Check dimension scores
    if (l.dimensions) {
      for (const dim of DIMENSION_IDS) {
        const val = l.dimensions[dim];
        if (typeof val !== 'number' || val < 0 || val > 1) {
          error(`Leader ${l.id} dimension ${dim} = ${val} (should be 0-1)`);
        }
      }
    }
  }

  // Check archetype distribution
  for (const aId of archetypeIds) {
    const count = leaders.filter((l: any) => l.primaryArchetype === aId).length;
    if (count < 10) warn(`Archetype ${aId} has only ${count} leaders (expected 10+)`);
    console.log(`  ${aId}: ${count} leaders`);
  }
  console.log(`  Total: ${leaders.length} leaders, ${leaderIds.size} unique\n`);

  // --- Quiz ---
  console.log('3. Quiz');
  const questions = quizJson.questions;
  check(Array.isArray(questions), 'quiz questions should be an array');
  check(questions.length === 24, `Expected 24 questions, got ${questions.length}`);

  const primaryCounts: Record<string, number> = {};
  for (const dim of DIMENSION_IDS) primaryCounts[dim] = 0;

  for (const q of questions) {
    check(typeof q.id === 'string', `Question missing id`);
    check(typeof q.scenario === 'string' && q.scenario.length > 20, `Question ${q.id} scenario too short`);
    check(Array.isArray(q.options) && q.options.length === 4, `Question ${q.id} should have 4 options`);

    for (const opt of q.options ?? []) {
      check(typeof opt.text === 'string' && opt.text.length > 10, `Option ${opt.id} text too short`);
      check(typeof opt.weights === 'object', `Option ${opt.id} missing weights`);

      if (opt.weights) {
        const primary = Object.entries(opt.weights as Record<string, number>)
          .sort((a, b) => b[1] - a[1])[0];
        if (primary) {
          primaryCounts[primary[0]] = (primaryCounts[primary[0]] || 0) + 1;
        }
      }
    }
  }

  console.log('  Primary dimension coverage:');
  for (const [dim, count] of Object.entries(primaryCounts)) {
    console.log(`    ${dim}: ${count} options`);
    if (count < 10) warn(`Dimension ${dim} underrepresented in quiz (${count} options)`);
  }
  console.log();

  // --- Learning Paths ---
  console.log('4. Learning Paths');
  const paths = learningPathsJson.paths;
  check(Array.isArray(paths), 'learning paths should be an array');
  check(paths.length >= 10, `Expected 10+ learning paths, got ${paths.length}`);

  for (const path of paths) {
    check(typeof path.id === 'string', `Path missing id`);
    check(Array.isArray(path.episodes) && path.episodes.length >= 3, `Path ${path.id} should have 3+ episodes`);

    for (const ep of path.episodes ?? []) {
      if (!leaderIds.has(ep.leaderId)) {
        error(`Path ${path.id} references invalid leader: ${ep.leaderId}`);
      }
    }
  }
  console.log(`  ${paths.length} learning paths\n`);

  // --- Summary ---
  console.log('=== VALIDATION SUMMARY ===');
  console.log(`Errors:   ${errors}`);
  console.log(`Warnings: ${warnings}`);

  if (errors > 0) {
    console.log('\nValidation FAILED. Fix errors before proceeding.');
    process.exit(1);
  } else {
    console.log('\nValidation PASSED.');
  }
}

main();
