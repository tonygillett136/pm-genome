import { useRef, useCallback } from 'react';
import type { DimensionScores } from '../../lib/scoring';
import type { Archetype } from '../../lib/matching';
import { DIMENSIONS } from '../../lib/constants';

interface Props {
  archetype: Archetype;
  scores: DimensionScores;
  shareUrl: string;
}

export default function ShareCard({ archetype, scores, shareUrl }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('Link copied!');
    }
  }, [shareUrl]);

  const shareToTwitter = () => {
    const text = `I'm "${archetype.name}" — ${archetype.tagline}. Discover your product leadership DNA:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `pm-genome-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
  }, [archetype.id]);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Share Your Results</h2>

      {/* Preview card */}
      <div
        ref={cardRef}
        className="mb-6 overflow-hidden rounded-xl border border-[#2A2A3A] bg-gradient-to-br from-[#0F0F13] to-[#1A1A23] p-8"
      >
        <div className="mb-4 text-sm font-medium uppercase tracking-widest text-[#6366F1]">
          PM Genome
        </div>
        <h3 className="mb-2 text-3xl font-extrabold">{archetype.name}</h3>
        <p className="mb-6 text-[#9CA3AF]">{archetype.tagline}</p>

        {/* Mini dimension bars */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {DIMENSIONS.map((dim) => (
            <div key={dim.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[#9CA3AF]">{dim.shortName}</span>
                <span style={{ color: dim.color }}>
                  {Math.round((scores[dim.id] ?? 0) * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#2A2A3A]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(scores[dim.id] ?? 0) * 100}%`,
                    backgroundColor: dim.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={shareToTwitter}
          className="rounded-lg bg-[#1A1A23] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#24243A]"
        >
          Share on X
        </button>
        <button
          onClick={shareToLinkedIn}
          className="rounded-lg bg-[#1A1A23] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#24243A]"
        >
          Share on LinkedIn
        </button>
        <button
          onClick={copyLink}
          className="rounded-lg bg-[#1A1A23] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#24243A]"
        >
          Copy Link
        </button>
        <button
          onClick={downloadCard}
          className="rounded-lg bg-[#1A1A23] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#24243A]"
        >
          Download Image
        </button>
      </div>
    </div>
  );
}
