/**
 * URL encoding/decoding for quiz answers.
 * Encodes 24 answers (each 0-3) into a compact URL-safe string.
 */

/**
 * Encode quiz answers to a URL-safe string.
 * Each answer is 0-3 (base 4), packed into characters.
 */
export function encodeAnswers(answers: Record<number, number>, totalQuestions: number): string {
  // Pack pairs of base-4 digits into a single byte (0-15)
  const bytes: number[] = [];
  for (let i = 0; i < totalQuestions; i += 2) {
    const a = answers[i] ?? 0;
    const b = answers[i + 1] ?? 0;
    bytes.push(a * 4 + b);
  }
  // Convert to base64url
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a URL-safe string back into quiz answers.
 */
export function decodeAnswers(encoded: string, totalQuestions: number): Record<number, number> {
  // Restore base64
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);

  const answers: Record<number, number> = {};
  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i);
    const qi = i * 2;
    if (qi < totalQuestions) answers[qi] = Math.floor(byte / 4);
    if (qi + 1 < totalQuestions) answers[qi + 1] = byte % 4;
  }
  return answers;
}
