/**
 * Parses raw transcript text files into structured turns.
 *
 * Handles multiple format variations:
 * 1. Standard: "Speaker Name (HH:MM:SS):" with blank lines between turns
 * 2. No blanks: Same format but no blank lines (e.g., Vijay.txt)
 * 3. Uppercase: "SPEAKER NAME (HH:MM:SS):" (e.g., Kunal Shah.txt)
 * 4. No timestamp: "Speaker Name:" only (e.g., Adriel Frederick.txt)
 * 5. Bracket timestamp: "[HH:MM:SS] Speaker:" (e.g., Ryan Hoover.txt)
 * 6. Continuation: "(HH:MM:SS):" (same speaker, no name)
 *
 * Timestamps can be either MM:SS or HH:MM:SS.
 */

export interface Turn {
  speaker: string;
  isGuest: boolean;
  timestamp: string;
  text: string;
}

// Format 1/2/3: "Speaker Name (HH:MM:SS):" or "(HH:MM:SS):"
const STANDARD_HEADER = /^(?:(.+?)\s+)?\((\d{1,2}:\d{2}(?::\d{2})?)\):$/;

// Format 4: "Speaker Name:" (no timestamp, just name followed by colon)
// Must be a name-like string (2-4 words, each starting uppercase) to avoid false positives
const NO_TIMESTAMP_HEADER = /^([A-Z][a-z]+(?:\s+[A-Za-z''.]+){0,4}):$/;

// Format 5: "[HH:MM:SS] Speaker: content" (bracket timestamp, speaker, and content on one line)
const BRACKET_LINE = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s+([A-Za-z][A-Za-z .''-]+?):\s*(.*)$/;

interface ParsedHeader {
  speaker: string | null;
  timestamp: string;
  inlineContent?: string; // For bracket format where content is on the same line
}

/**
 * Try all header formats and return the parsed result.
 */
function parseTurnHeader(line: string, knownSpeakers: Set<string>): ParsedHeader | null {
  // Try standard format first (most common): "Speaker (HH:MM:SS):" or "(HH:MM:SS):"
  const stdMatch = line.match(STANDARD_HEADER);
  if (stdMatch) {
    return {
      speaker: stdMatch[1]?.trim() ?? null,
      timestamp: normalizeTimestamp(stdMatch[2]),
    };
  }

  // Try bracket format: "[HH:MM:SS] Speaker: content on same line"
  const bracketMatch = line.match(BRACKET_LINE);
  if (bracketMatch) {
    return {
      speaker: bracketMatch[2].trim(),
      timestamp: normalizeTimestamp(bracketMatch[1]),
      inlineContent: bracketMatch[3]?.trim() || undefined,
    };
  }

  // Try no-timestamp format: "Speaker Name:"
  // Only match if the name matches a known speaker to avoid false positives
  const noTsMatch = line.match(NO_TIMESTAMP_HEADER);
  if (noTsMatch) {
    const name = noTsMatch[1].trim();
    if (knownSpeakers.has(normalizeSpeakerKey(name)) || isLennyVariant(name)) {
      return {
        speaker: name,
        timestamp: '00:00:00',
      };
    }
  }

  return null;
}

function normalizeTimestamp(ts: string): string {
  const parts = ts.split(':');
  if (parts.length === 2) {
    return `00:${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  return `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2]}`;
}

function normalizeSpeakerKey(name: string): string {
  return name.toLowerCase().replace(/['']/g, "'");
}

function isLennyVariant(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'lenny' || lower === 'lenny rachitsky';
}

/**
 * Normalize speaker names:
 * - "Lenny Rachitsky" / "LENNY RACHITSKY" / "Lenny" → "Lenny"
 * - Uppercase guest names → match the canonical guest name
 */
function normalizeSpeaker(name: string, guestNameMap: Map<string, string>): string {
  if (isLennyVariant(name)) return 'Lenny';
  const key = normalizeSpeakerKey(name);
  return guestNameMap.get(key) ?? name;
}

function isSponsorRead(text: string): boolean {
  const lower = text.toLowerCase();
  const signals = [
    'brought to you by',
    'this episode is brought to you',
    "today's sponsor",
    "today's sponsors",
    'word from our sponsor',
    'short word from our',
    '/lenny',
    '.com/lenny',
  ];
  return signals.some((s) => lower.includes(s));
}

/**
 * Detect the format of a transcript file to build the known speakers set.
 * Scans first 30 lines to find speaker patterns.
 */
function detectSpeakers(lines: string[]): Set<string> {
  const speakers = new Set<string>();
  const scanLines = lines.slice(0, 60);

  for (const rawLine of scanLines) {
    const line = rawLine.trim();

    const stdMatch = line.match(STANDARD_HEADER);
    if (stdMatch && stdMatch[1]) {
      speakers.add(normalizeSpeakerKey(stdMatch[1].trim()));
      continue;
    }

    const bracketMatch = line.match(BRACKET_LINE);
    if (bracketMatch) {
      speakers.add(normalizeSpeakerKey(bracketMatch[2].trim()));
      continue;
    }

    const noTsMatch = line.match(NO_TIMESTAMP_HEADER);
    if (noTsMatch) {
      speakers.add(normalizeSpeakerKey(noTsMatch[1].trim()));
    }
  }

  return speakers;
}

/**
 * Parse a raw transcript file into structured turns.
 */
export function parseTranscript(raw: string, guestNames: string[]): Turn[] {
  const lines = raw.split('\n');
  const turns: Turn[] = [];

  // Build guest name map: lowercase key → canonical name
  // Also map first-name-only variants (e.g., "ryan" → "Ryan Hoover")
  const guestNameMap = new Map<string, string>();
  for (const name of guestNames) {
    guestNameMap.set(normalizeSpeakerKey(name), name);
    const firstName = name.split(' ')[0];
    if (firstName && !isLennyVariant(firstName)) {
      guestNameMap.set(normalizeSpeakerKey(firstName), name);
    }
  }

  // Detect known speakers from the file
  const knownSpeakers = detectSpeakers(lines);
  // Also add guest names as known speakers
  for (const name of guestNames) {
    knownSpeakers.add(normalizeSpeakerKey(name));
  }
  // Add Lenny variants
  knownSpeakers.add('lenny');
  knownSpeakers.add('lenny rachitsky');

  const guestNormalizedSet = new Set(guestNames.map((n) => n));

  let currentSpeaker: string | null = null;
  let currentTimestamp: string | null = null;
  let currentLines: string[] = [];

  function flushTurn() {
    if (currentSpeaker && currentTimestamp && currentLines.length > 0) {
      const text = currentLines.join('\n').trim();
      if (text) {
        const normalized = normalizeSpeaker(currentSpeaker, guestNameMap);
        turns.push({
          speaker: normalized,
          isGuest: guestNormalizedSet.has(normalized),
          timestamp: currentTimestamp,
          text,
        });
      }
    }
    currentLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') continue;

    const header = parseTurnHeader(line, knownSpeakers);

    if (header) {
      flushTurn();
      if (header.speaker) {
        currentSpeaker = header.speaker;
      }
      currentTimestamp = header.timestamp;
      // Bracket format has content on the same line as the header
      if (header.inlineContent) {
        currentLines.push(header.inlineContent);
      }
    } else {
      if (currentSpeaker) {
        currentLines.push(line);
      }
    }
  }

  flushTurn();
  return turns;
}

/**
 * Extract Lenny's intro paragraph to get guest metadata.
 */
export function extractIntroInfo(turns: Turn[]): string | null {
  for (const turn of turns) {
    if (turn.speaker === 'Lenny') {
      const lower = turn.text.toLowerCase();
      if (
        lower.includes('today my guest') ||
        lower.includes('my guest is') ||
        lower.includes('welcome to lenny') ||
        lower.includes('in our conversation') ||
        lower.includes('in this episode') ||
        lower.includes('today, my guest')
      ) {
        return turn.text;
      }
    }
  }
  return null;
}

/**
 * Filter out sponsor read turns.
 */
export function filterSponsorReads(turns: Turn[]): Turn[] {
  return turns.filter((turn) => {
    if (turn.speaker !== 'Lenny') return true;
    return !isSponsorRead(turn.text);
  });
}
