# The PM Genome Project

**Discover your product leadership DNA.**

An interactive self-assessment built from 302 Lenny's Podcast transcripts. Take a 24-question scenario-based quiz to discover your product leadership archetype, matched leaders, blind spots, and personalised learning path.

**Live at [pm-genome.pages.dev](https://pm-genome.pages.dev/)**

---

## What It Does

The PM Genome Project analyses conversations with 280+ world-class product leaders to map the landscape of product leadership across six dimensions:

| Dimension | What It Measures |
|---|---|
| **Strategic Vision** | Direction-setting, first principles, long-term bets |
| **Execution & Craft** | Shipping velocity, quality obsession, design excellence |
| **Data & Experimentation** | Measurement rigour, A/B testing, evidence-based decisions |
| **Growth & Distribution** | Growth loops, PLG, viral mechanics, acquisition strategy |
| **Team & Leadership** | Hiring, culture, coaching, org design |
| **User Empathy & Research** | Customer obsession, design thinking, JTBD |

K-means clustering on 284 leader score vectors revealed **7 distinct archetypes**:

1. **The Visionary** — See the future, then build it
2. **The Craftsperson** — Obsessed with how it's built
3. **The Scientist** — Let the data decide
4. **The Growth Architect** — Engineer the growth machine
5. **The Growth Scientist** — Experiment, measure, scale
6. **The Org Builder** — Build the team that builds the product
7. **The Operator** — The complete product leader

## How It Works

1. **Take the quiz** — 24 scenario-based questions across three tiers (Daily Grind, Hard Tradeoffs, Defining Moments). Every option is a smart, reasonable response — the differences reveal what you prioritise.
2. **Get your results** — Your primary archetype, a 6-axis radar chart, your top 5 matched leaders (by cosine similarity), blind spot analysis, and a curated learning path of podcast episodes.
3. **Share** — Results are encoded into a ~16 character URL parameter. No backend, no sign-up, no data collection.

## Stack

- **Astro 5** — static site generator (~80% zero-JS HTML pages)
- **React 19** — islands for interactive components (quiz, results, leader search)
- **Tailwind CSS 4** — dark theme with custom dimension colours
- **Recharts** — 6-axis radar charts
- **nanostores** — cross-island state management
- **Cloudflare Pages** — free tier hosting, unlimited bandwidth

**No backend.** Quiz scoring is client-side maths against pre-computed JSON. The entire site is 297 static pages. Monthly hosting cost: $0.

## Project Structure

```
pm-genome/
├── src/
│   ├── data/                    # Pre-computed JSON (output of data pipeline)
│   │   ├── archetypes.json      # 7 archetypes with dimension centroids
│   │   ├── leaders.json         # 284 leaders with scores and assignments
│   │   ├── learning-paths.json  # 12 curated episode paths
│   │   └── quiz.json            # 24 questions, 4 options each
│   ├── pages/                   # Astro pages (static + React islands)
│   ├── components/              # React components (quiz, results, leaders)
│   ├── lib/                     # Scoring, matching, URL sharing logic
│   └── stores/                  # nanostores for quiz state
├── scripts/                     # One-time data pipeline (not deployed)
│   ├── 00-normalize.ts          # Parse 302 transcripts → structured JSON
│   ├── 01-extract.ts            # Per-transcript analysis
│   ├── 02a-cluster-only.ts      # K-means clustering (k=7)
│   ├── 02b-write-archetypes.ts  # Archetype definitions from clusters
│   ├── 03-score-leaders.ts      # Leader scoring + learning paths
│   └── 05-validate.ts           # Data integrity checks
└── carousel/                    # LinkedIn carousel slides
```

## Getting Started

```bash
npm install
npm run dev          # Dev server with hot reload
npm run build        # Production build → dist/ (297 pages, ~7s)
npx astro preview    # Serve built site locally
```

## Deploy

```bash
npx wrangler pages deploy dist --project-name pm-genome
```

## Data Pipeline

The `scripts/` directory contains the one-time pipeline that generated the four JSON files in `src/data/`. Three Claude agents read all 302 transcripts to extract dimension scores, themes, quotes, and biographical context for each leader. The intermediate data (normalised transcripts, extraction JSONs) is gitignored.

See [scripts/README.md](scripts/README.md) for details on re-running the pipeline.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page (static) |
| `/quiz` | 24-question assessment (React island) |
| `/results?s={encoded}` | Results with archetype, radar chart, matched leaders, learning path |
| `/archetypes` | Archetype gallery (static) |
| `/archetypes/[slug]` | 7 archetype detail pages (static) |
| `/leaders` | Leader directory with search (React island) |
| `/leaders/[slug]` | 284 leader profiles (static) |
| `/methodology` | How it works (static) |

## Credits

- Transcript data from [Lenny's Podcast](https://www.lennyspodcast.com/), released publicly by Lenny Rachitsky
- Built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## Licence

MIT
