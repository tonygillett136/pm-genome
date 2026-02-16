/**
 * Step 4: Generate scenario-based quiz questions using Claude.
 *
 * Takes the finalized archetypes and generates 24 questions (4 per dimension)
 * with weighted scoring options.
 *
 * Usage: npx tsx 04-generate-quiz.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const OUTPUT_DIR = resolve(import.meta.dirname, '../src/data');
const PROMPT_TEMPLATE = readFileSync(
  resolve(import.meta.dirname, 'prompts/quiz.md'),
  'utf-8',
);

const DIMENSION_IDS = [
  'strategic-vision',
  'execution-craft',
  'data-experimentation',
  'growth-distribution',
  'team-leadership',
  'user-empathy',
] as const;

async function main() {
  // Load archetypes for context
  const archetypesJson = JSON.parse(
    readFileSync(join(OUTPUT_DIR, 'archetypes.json'), 'utf-8'),
  );

  const archetypeSummary = archetypesJson.archetypes
    .map(
      (a: any) =>
        `**${a.name}** (${a.id}): ${a.tagline}. Top dimensions: ${Object.entries(a.dimensions as Record<string, number>)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([k, v]) => `${k} (${v})`)
          .join(', ')}`,
    )
    .join('\n');

  let prompt = PROMPT_TEMPLATE.replace('{{archetypes}}', archetypeSummary);

  console.log('Generating quiz questions with Claude...');

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16384,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = response.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  let questions;
  try {
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    questions = JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse Claude response. Saving raw output.');
    writeFileSync(join(OUTPUT_DIR, 'quiz-raw.txt'), responseText);
    throw e;
  }

  // Validate
  if (!Array.isArray(questions) || questions.length !== 24) {
    console.error(`Expected 24 questions, got ${Array.isArray(questions) ? questions.length : 'non-array'}`);
  }

  // Validate dimension coverage
  const primaryCounts: Record<string, number> = {};
  for (const dim of DIMENSION_IDS) primaryCounts[dim] = 0;

  for (const q of questions) {
    if (!q.options || q.options.length !== 4) {
      console.error(`Question ${q.id} has ${q.options?.length ?? 0} options (expected 4)`);
      continue;
    }
    for (const opt of q.options) {
      const primaryDim = Object.entries(opt.weights as Record<string, number>)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      if (primaryDim) {
        primaryCounts[primaryDim] = (primaryCounts[primaryDim] || 0) + 1;
      }
    }
  }

  console.log('\nDimension coverage (primary weights):');
  for (const [dim, count] of Object.entries(primaryCounts)) {
    console.log(`  ${dim}: ${count} options`);
  }

  // Build quiz.json
  const quizJson = {
    version: '1.0.0',
    meta: {
      totalQuestions: questions.length,
      questionsPerDimension: 4,
      estimatedMinutes: 8,
    },
    questions,
  };

  writeFileSync(
    join(OUTPUT_DIR, 'quiz.json'),
    JSON.stringify(quizJson, null, 2),
  );

  console.log(`\nQuiz written to ${join(OUTPUT_DIR, 'quiz.json')}`);
}

main().catch(console.error);
