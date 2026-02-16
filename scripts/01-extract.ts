/**
 * Step 1: Extract structured data from each normalized transcript using Claude Batch API.
 *
 * Sends each transcript to Claude for analysis, extracting:
 * - Guest metadata (name, title, company, bio)
 * - Key themes, leadership principles
 * - Dimension scores (6 PM dimensions, 0.0-1.0)
 * - Notable quotes
 * - Episode summary
 *
 * Usage: npx tsx 01-extract.ts
 *
 * Env: ANTHROPIC_API_KEY must be set.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { runBatch, type BatchRequest } from './lib/batch-api.js';

const NORMALIZED_DIR = resolve(import.meta.dirname, 'normalized');
const EXTRACTED_DIR = resolve(import.meta.dirname, 'extracted');
const PROMPT_TEMPLATE = readFileSync(
  resolve(import.meta.dirname, 'prompts/extract.md'),
  'utf-8'
);

// Model for extraction — Haiku 3.5 is cheapest with good quality
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 4096;

// Maximum input characters to send per transcript (to stay within context limits)
const MAX_CONTENT_CHARS = 180_000; // ~45K tokens for Haiku context

interface NormalizedTranscript {
  slug: string;
  guests: Array<{
    name: string;
    titleFromIntro: string | null;
    companyFromIntro: string | null;
  }>;
  contentText: string;
}

function buildPrompt(transcript: NormalizedTranscript): string {
  const guest = transcript.guests[0];
  let prompt = PROMPT_TEMPLATE;

  prompt = prompt.replace('{{guestName}}', guest.name);

  // Handle conditional sections
  if (guest.titleFromIntro) {
    prompt = prompt.replace(
      '{{#if titleFromIntro}}Their role (from intro): {{titleFromIntro}}{{/if}}',
      `Their role (from intro): ${guest.titleFromIntro}`
    );
  } else {
    prompt = prompt.replace('{{#if titleFromIntro}}Their role (from intro): {{titleFromIntro}}{{/if}}', '');
  }

  if (guest.companyFromIntro) {
    prompt = prompt.replace(
      '{{#if companyFromIntro}}Company: {{companyFromIntro}}{{/if}}',
      `Company: ${guest.companyFromIntro}`
    );
  } else {
    prompt = prompt.replace('{{#if companyFromIntro}}Company: {{companyFromIntro}}{{/if}}', '');
  }

  // Truncate transcript if too long
  let content = transcript.contentText;
  if (content.length > MAX_CONTENT_CHARS) {
    content = content.slice(0, MAX_CONTENT_CHARS) + '\n\n[TRANSCRIPT TRUNCATED]';
  }

  prompt = prompt.replace('{{transcript}}', content);
  return prompt;
}

async function main() {
  if (!existsSync(EXTRACTED_DIR)) {
    mkdirSync(EXTRACTED_DIR, { recursive: true });
  }

  // Load all normalized transcripts
  const files = readdirSync(NORMALIZED_DIR)
    .filter((f) => f.endsWith('.json') && f !== '_manifest.json');

  console.log(`Found ${files.length} normalized transcripts`);

  // Check which ones are already extracted
  const alreadyExtracted = new Set(
    readdirSync(EXTRACTED_DIR).filter((f) => f.endsWith('.json')).map((f) => f)
  );

  const toProcess: Array<{ slug: string; prompt: string }> = [];

  for (const file of files) {
    if (alreadyExtracted.has(file)) {
      continue; // Skip already extracted
    }

    const transcript: NormalizedTranscript = JSON.parse(
      readFileSync(join(NORMALIZED_DIR, file), 'utf-8')
    );

    if (!transcript.guests.length) continue;

    const prompt = buildPrompt(transcript);
    toProcess.push({ slug: transcript.slug, prompt });
  }

  if (toProcess.length === 0) {
    console.log('All transcripts already extracted. Nothing to do.');
    return;
  }

  console.log(`${toProcess.length} transcripts to extract (${alreadyExtracted.size} already done)`);

  // Build batch requests
  const requests: BatchRequest[] = toProcess.map((item) => ({
    custom_id: item.slug,
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user' as const, content: item.prompt }],
    },
  }));

  // Submit batch and wait for results
  console.log(`\nSubmitting batch to Claude ${MODEL}...`);
  const results = await runBatch(requests);

  // Process results
  let succeeded = 0;
  let errored = 0;

  for (const result of results) {
    const slug = result.custom_id;

    if (result.result.type === 'succeeded' && result.result.message) {
      const text = result.result.message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');

      try {
        // Try to parse JSON (handle possible markdown fences)
        let jsonText = text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(jsonText);

        writeFileSync(
          join(EXTRACTED_DIR, `${slug}.json`),
          JSON.stringify(parsed, null, 2)
        );
        succeeded++;
      } catch (e) {
        console.error(`  JSON parse error for ${slug}:`, (e as Error).message);
        // Save raw text for debugging
        writeFileSync(join(EXTRACTED_DIR, `${slug}.raw.txt`), text);
        errored++;
      }
    } else {
      console.error(`  Batch error for ${slug}:`, result.result.error?.message ?? result.result.type);
      errored++;
    }
  }

  console.log(`\n--- Extraction Summary ---`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Errored: ${errored}`);
  console.log(`Output: ${EXTRACTED_DIR}`);
}

main().catch(console.error);
