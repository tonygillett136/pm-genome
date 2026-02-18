# PM Genome Project

Interactive product leadership self-assessment built from 302 Lenny's Podcast transcripts. PMs take a 24-question scenario-based quiz to discover their product leadership archetype, matched leaders, blind spots, and personalized learning path.

**Live**: https://gillett-projects.com/pm-genome/

## Stack

- **Astro 5** — static site generator (~80% zero-JS HTML pages)
- **React 19** — islands for interactive components (quiz, results, leader search) via `client:load`
- **Tailwind CSS 4** — dark theme with custom dimension colors
- **Recharts** — 6-axis radar charts on results page
- **nanostores** — cross-island state management (quiz answers, progress)
- **html-to-image** — shareable result card generation

## Commands

```bash
npm run dev          # Dev server (hot reload)
npm run build        # Production build → dist/ (297 pages, ~7s)
npx astro preview    # Serve built dist/ locally
npm run build && mkdir -p dist-deploy/pm-genome && cp -r dist/* dist-deploy/pm-genome/ && npx wrangler pages deploy dist-deploy --project-name pm-genome  # Deploy to Cloudflare Pages
```

## Architecture

**No backend.** Quiz scoring is client-side math against pre-computed JSON. Results are shareable via URL-encoded quiz answers (`?s=` parameter).

### Key data files (src/data/)
- `archetypes.json` — 7 archetypes with dimension centroids, descriptions, strengths/blind spots
- `leaders.json` — 284 leaders with dimension scores, archetype assignments, quotes, bios
- `learning-paths.json` — 12 curated episode paths (strengths + blind spots per dimension)
- `quiz.json` — 24 scenario-based questions with weighted dimension scores per option

### Pages
- `/` — Static landing page
- `/quiz` — React island: 24-question assessment with localStorage persistence
- `/results?s={encoded}` — React island: archetype, radar chart, matched leaders, blind spots, learning path
- `/archetypes` + `/archetypes/[slug]` — 7 archetype pages (static, getStaticPaths)
- `/leaders` + `/leaders/[slug]` — 284 leader profiles (static, getStaticPaths)
- `/methodology` — Static explanation page

### Data flow
Quiz answers → `scoring.ts` (sum weights, normalize to 0-1) → `matching.ts` (cosine similarity vs archetypes + leaders) → results render

### URL sharing
`sharing.ts`: 24 answers (each 0-3, base-4) → pack pairs into bytes → base64url encode. ~16 char `?s=` param. Decode reverses the process.

## The 6 Dimensions

| ID | Name | Color |
|---|---|---|
| `strategic-vision` | Strategic Vision | `#6366F1` |
| `execution-craft` | Execution & Craft | `#F59E0B` |
| `data-experimentation` | Data & Experimentation | `#10B981` |
| `growth-distribution` | Growth & Distribution | `#EF4444` |
| `team-leadership` | Team & Leadership | `#8B5CF6` |
| `user-empathy` | User Empathy & Research | `#EC4899` |

## Theme

Dark theme. Background `#0F0F13`, cards `#1A1A24`, borders `#2A2A3A`, text `#E0E0E6`, muted `#9CA3AF`. Dimension colors above are used throughout for consistency.

## Data Pipeline (scripts/)

The `scripts/` directory contains the one-time data pipeline that generated the 4 JSON files in `src/data/`. The intermediate data (`scripts/extracted/`, `scripts/normalized/`) is gitignored. The pipeline scripts have their own `package.json`.

Extraction was done by Claude agents reading transcripts directly — no API key needed. To re-run, see the scripts README or memory notes.

## Conventions

- **Astro pages** handle static rendering and data loading in frontmatter
- **React components** are only used where interactivity is needed (quiz, results, leader search)
- **Data imports** use `import data from '../../data/file.json'` (Vite-compatible), NOT fs.readFileSync
- **TypeScript generics** like `Record<string, number>` must NOT appear in .astro template expressions (causes esbuild parse errors) — move logic to frontmatter instead
- Dynamic routes use `getStaticPaths()` with direct JSON imports
