/**
 * Resolves ambiguous guest names and normalizes filename quirks.
 */

// Manual overrides for files where the filename alone is ambiguous
const NAME_OVERRIDES: Record<string, string> = {
  Boz: "Andrew 'Boz' Bosworth",
  Melissa: 'Melissa Perri',
  Gergely: 'Gergely Orosz',
  Vijay: 'Vijay Iyengar',
  'Inbal S': 'Inbal Shani',
  'Crystal W': 'Crystal Widjaja',
  'Nabeel S. Qureshi': 'Nabeel Qureshi',
};

// Files that are compilations/special episodes (not single-guest interviews)
const EXCLUDED_FILES = new Set([
  'Failure.txt',
  'Teaser_2021.txt',
  'EOY Review.txt',
  'Interview Q Compilation.txt',
  'Shreyas Doshi Live.txt',
]);

/**
 * Parse a transcript filename to extract guest name(s), appearance number, and type.
 */
export function parseFilename(filename: string): {
  guests: string[];
  appearanceNumber: number;
  type: 'interview' | 'multi-guest' | 'compilation';
  excluded: boolean;
} {
  if (EXCLUDED_FILES.has(filename)) {
    return { guests: [], appearanceNumber: 1, type: 'compilation', excluded: true };
  }

  let baseName = filename.replace(/\.txt$/, '');

  // Strip trailing underscores (Andy Raskin_, Casey Winters_)
  baseName = baseName.replace(/_$/, '');

  // Detect appearance number (e.g., "Elena Verna 2.0" → 2)
  let appearanceNumber = 1;
  const versionMatch = baseName.match(/^(.+?)\s+(\d+)\.0$/);
  if (versionMatch) {
    baseName = versionMatch[1];
    appearanceNumber = parseInt(versionMatch[2], 10);
  }

  // Detect multi-guest (+ or &)
  const isMultiGuest = /\s[+&]\s/.test(baseName);
  if (isMultiGuest) {
    const guests = baseName.split(/\s+[+&]\s+/).map((name) => resolveGuestName(name.trim()));
    return { guests, appearanceNumber, type: 'multi-guest', excluded: false };
  }

  const resolvedName = resolveGuestName(baseName);
  return { guests: [resolvedName], appearanceNumber, type: 'interview', excluded: false };
}

function resolveGuestName(name: string): string {
  return NAME_OVERRIDES[name] ?? name;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
