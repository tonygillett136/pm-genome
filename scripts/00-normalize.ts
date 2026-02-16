/**
 * Step 0: Normalize raw transcript files into structured JSON.
 *
 * Reads all .txt files from the transcripts directory, parses them,
 * and outputs normalized JSON files ready for Claude extraction.
 *
 * Usage: npx tsx 00-normalize.ts
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parseFilename, slugify } from './lib/name-resolver.js';
import { parseTranscript, extractIntroInfo, filterSponsorReads, type Turn } from './lib/transcript-parser.js';

const TRANSCRIPTS_DIR = resolve(import.meta.dirname, '../../transcripts');
const OUTPUT_DIR = resolve(import.meta.dirname, 'normalized');

interface NormalizedTranscript {
  slug: string;
  filename: string;
  guests: Array<{
    name: string;
    slug: string;
    titleFromIntro: string | null;
    companyFromIntro: string | null;
  }>;
  appearanceNumber: number;
  type: 'interview' | 'multi-guest' | 'compilation';
  totalTurns: number;
  totalWords: number;
  introText: string | null;
  turns: Turn[];
  guestOnlyText: string;
  contentText: string;
}

/**
 * Try to extract title and company from Lenny's intro.
 * Looks for patterns like "X is the CPO of Y" or "X is head of growth at Y"
 */
function extractTitleAndCompany(
  introText: string | null,
  guestName: string
): { title: string | null; company: string | null } {
  if (!introText) return { title: null, company: null };

  // Try various patterns
  const firstName = guestName.split(' ')[0];
  const namePattern = guestName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const firstNamePattern = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Pattern: "[Name] is the [title] at/of [company]"
  const patterns = [
    new RegExp(`${namePattern}[^.]*?(?:is|was)\\s+(?:the\\s+)?(.+?)\\s+(?:at|of)\\s+([A-Z][^,\\.]+)`, 'i'),
    new RegExp(`${firstNamePattern}[^.]*?(?:is|was)\\s+(?:the\\s+)?(.+?)\\s+(?:at|of)\\s+([A-Z][^,\\.]+)`, 'i'),
    // Pattern: "[Name], [title] at [company]"
    new RegExp(`${namePattern},\\s+(.+?)\\s+(?:at|of)\\s+([A-Z][^,\\.]+)`, 'i'),
    new RegExp(`${firstNamePattern},\\s+(.+?)\\s+(?:at|of)\\s+([A-Z][^,\\.]+)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = introText.match(pattern);
    if (match) {
      let title = match[1].trim();
      let company = match[2].trim();
      // Clean up common artifacts
      title = title.replace(/^(currently|formerly|previously)\s+/i, '');
      company = company.replace(/[,.]$/, '');
      if (title.length < 100 && company.length < 60) {
        return { title, company };
      }
    }
  }

  return { title: null, company: null };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = readdirSync(TRANSCRIPTS_DIR).filter((f) => f.endsWith('.txt'));
  console.log(`Found ${files.length} transcript files\n`);

  let processed = 0;
  let excluded = 0;
  const errors: string[] = [];
  const allResults: NormalizedTranscript[] = [];

  for (const file of files) {
    const parsed = parseFilename(file);

    if (parsed.excluded) {
      console.log(`  SKIP (compilation): ${file}`);
      excluded++;
      continue;
    }

    try {
      const raw = readFileSync(join(TRANSCRIPTS_DIR, file), 'utf-8');
      const turns = parseTranscript(raw, parsed.guests);

      if (turns.length === 0) {
        console.log(`  WARN: No turns parsed from ${file}`);
        errors.push(`No turns: ${file}`);
        continue;
      }

      const introText = extractIntroInfo(turns);
      const filteredTurns = filterSponsorReads(turns);

      // For each guest, create a normalized entry
      for (const guestName of parsed.guests) {
        const slug = slugify(guestName);
        const { title, company } = extractTitleAndCompany(introText, guestName);

        const guestOnlyTurns = filteredTurns.filter((t) => t.isGuest);
        const guestOnlyText = guestOnlyTurns.map((t) => t.text).join('\n\n');
        const contentText = filteredTurns.map((t) => `${t.speaker}: ${t.text}`).join('\n\n');

        // For repeat guests, append appearance number to slug
        const finalSlug =
          parsed.appearanceNumber > 1 ? `${slug}-${parsed.appearanceNumber}` : slug;

        const result: NormalizedTranscript = {
          slug: finalSlug,
          filename: file,
          guests: [
            {
              name: guestName,
              slug,
              titleFromIntro: title,
              companyFromIntro: company,
            },
          ],
          appearanceNumber: parsed.appearanceNumber,
          type: parsed.type,
          totalTurns: filteredTurns.length,
          totalWords: countWords(contentText),
          introText,
          turns: filteredTurns,
          guestOnlyText,
          contentText,
        };

        const outputPath = join(OUTPUT_DIR, `${finalSlug}.json`);
        writeFileSync(outputPath, JSON.stringify(result, null, 2));
        allResults.push(result);

        processed++;
      }
    } catch (err) {
      console.error(`  ERROR: ${file}: ${err}`);
      errors.push(`Error: ${file}: ${err}`);
    }
  }

  // Write a manifest of all normalized transcripts
  const manifest = allResults.map((r) => ({
    slug: r.slug,
    filename: r.filename,
    guestName: r.guests[0]?.name,
    guestSlug: r.guests[0]?.slug,
    title: r.guests[0]?.titleFromIntro,
    company: r.guests[0]?.companyFromIntro,
    appearanceNumber: r.appearanceNumber,
    type: r.type,
    totalTurns: r.totalTurns,
    totalWords: r.totalWords,
  }));

  writeFileSync(
    join(OUTPUT_DIR, '_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n--- Summary ---`);
  console.log(`Processed: ${processed} transcripts`);
  console.log(`Excluded:  ${excluded} compilations`);
  console.log(`Errors:    ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  // Stats
  const totalWords = allResults.reduce((acc, r) => acc + r.totalWords, 0);
  const totalTurns = allResults.reduce((acc, r) => acc + r.totalTurns, 0);
  console.log(`\nTotal words: ${totalWords.toLocaleString()}`);
  console.log(`Total turns: ${totalTurns.toLocaleString()}`);
  console.log(`Average turns per transcript: ${Math.round(totalTurns / processed)}`);
  console.log(`\nOutput written to: ${OUTPUT_DIR}`);
}

main();
