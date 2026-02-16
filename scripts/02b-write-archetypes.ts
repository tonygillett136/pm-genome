/**
 * Step 2b: Write archetypes.json from clustering results + manual characterization.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const EXTRACTED_DIR = resolve(import.meta.dirname, 'extracted');
const OUTPUT_DIR = resolve(import.meta.dirname, '../src/data');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const DIMENSION_IDS = [
  'strategic-vision',
  'execution-craft',
  'data-experimentation',
  'growth-distribution',
  'team-leadership',
  'user-empathy',
] as const;

// Load clustering data
const clusteringData = JSON.parse(
  readFileSync(join(EXTRACTED_DIR, '_clustering.json'), 'utf-8'),
);

// Map cluster index to archetype definition
// Based on cluster analysis results:
// Cluster 0 (36): team-leadership dominant — coaches, people leaders
// Cluster 1 (40): growth-distribution dominant — growth marketers, GTM
// Cluster 2 (38): growth + data hybrid — growth scientists
// Cluster 3 (20): data-experimentation dominant — scientists, AI/ML
// Cluster 4 (32): strategic-vision dominant — visionary CEOs
// Cluster 5 (66): balanced high — well-rounded operators/CPOs
// Cluster 6 (52): execution-craft dominant — craft-obsessed PMs

const archetypesByCluster: Record<number, any> = {
  0: {
    id: 'the-org-builder',
    name: 'The Org Builder',
    tagline: 'Great products come from great teams',
    description: 'Org Builders see people as the ultimate product leverage. They invest disproportionately in hiring, coaching, and organizational design because they\'ve learned that a well-structured team with strong culture consistently outperforms a brilliant individual contributor. They think in terms of org charts, decision frameworks, and communication cadences. Their superpower is building machines that build products — organizations where great work happens even when they\'re not in the room.',
    strengths: [
      'Builds high-performing teams that retain A-players',
      'Creates clarity in ambiguous environments through strong communication frameworks',
      'Coaches and develops other PMs into leaders',
      'Designs org structures that enable rather than constrain product velocity',
    ],
    blindSpots: [
      'Can over-index on process and people at the expense of shipping velocity',
      'May struggle to make hard product calls when the team disagrees',
      'Risk of building teams optimized for harmony rather than high-impact outcomes',
    ],
    growthEdge: 'Practice making strong product bets without consensus. Your instinct to align everyone can slow you down — sometimes the team needs a clear directive more than a collaborative process.',
  },
  1: {
    id: 'the-growth-architect',
    name: 'The Growth Architect',
    tagline: 'Distribution is the real product',
    description: 'Growth Architects see every product decision through the lens of distribution and acquisition. They obsess over growth loops, viral coefficients, and channel strategy because they know that the best product in the world fails without a way to reach users. They think in terms of funnels, cohort curves, and compounding effects. Their mental model of product extends well beyond the core experience into activation, retention, and expansion.',
    strengths: [
      'Identifies and builds sustainable growth loops that compound over time',
      'Connects product decisions to business model and distribution mechanics',
      'Thinks in systems and feedback loops rather than isolated features',
      'Bridges product, marketing, and sales with a unified growth strategy',
    ],
    blindSpots: [
      'May prioritize growth metrics over product quality and user trust',
      'Can undervalue features that don\'t directly move acquisition or retention numbers',
      'Risk of optimizing for short-term growth at the expense of long-term brand equity',
    ],
    growthEdge: 'Spend time with users who love your product but would never show up in a growth metric. The qualitative "why" behind user behavior often reveals the next compounding insight.',
  },
  2: {
    id: 'the-growth-scientist',
    name: 'The Growth Scientist',
    tagline: 'Hypothesize, test, compound',
    description: 'Growth Scientists combine the analytical rigor of a data scientist with the strategic instincts of a growth leader. They don\'t just track metrics — they design experiments, build growth models, and make evidence-based bets on the levers that will move the business. Every feature is a hypothesis. Every launch is an experiment. They bring measurement discipline to growth and growth urgency to measurement.',
    strengths: [
      'Builds rigorous growth models that connect features to business outcomes',
      'Designs and runs experiments at scale to find compounding growth levers',
      'Makes data-driven decisions without losing sight of strategic direction',
      'Creates measurement frameworks that the whole org can rally around',
    ],
    blindSpots: [
      'Can over-measure and under-act — analysis paralysis in pursuit of statistical significance',
      'May dismiss qualitative insights and user intuition as "not rigorous"',
      'Risk of optimizing known metrics instead of discovering new breakthrough vectors',
    ],
    growthEdge: 'Invest in the fuzzy front end of product development. Some of the best product insights come from watching users in person, not from dashboards. Pair your measurement superpower with genuine customer immersion.',
  },
  3: {
    id: 'the-scientist',
    name: 'The Scientist',
    tagline: 'Data over opinions, always',
    description: 'Scientists bring intellectual rigor and experimental methodology to product development. They believe that hunches are starting points, not conclusions, and that every meaningful product decision should be informed by evidence. Many are drawn to technical domains — AI/ML, developer tools, infrastructure — where the complexity demands systematic thinking. They build measurement frameworks, advocate for experimentation culture, and push their teams to quantify what others take on faith.',
    strengths: [
      'Brings measurement rigor to ambiguous product decisions',
      'Builds experimentation infrastructure and culture that scales',
      'Excels in technically complex domains requiring systematic problem-solving',
      'Creates frameworks that turn subjective debates into evidence-based discussions',
    ],
    blindSpots: [
      'Can be slow to act when data is insufficient or ambiguous',
      'May undervalue design intuition, user emotion, and qualitative signals',
      'Risk of building for technical elegance rather than user impact',
    ],
    growthEdge: 'Practice making decisions with 60% confidence and iterating. Your instinct for rigor is valuable, but speed-to-learning often matters more than precision of measurement.',
  },
  4: {
    id: 'the-visionary',
    name: 'The Visionary',
    tagline: 'See the future, then build it',
    description: 'Visionaries operate from first principles. They question assumptions that everyone else takes for granted and set ambitious, long-term direction for their products and companies. They\'re the leaders who saw that software would eat the world, that remote collaboration needed better tools, that AI would reshape product development. Their thinking is often years ahead of the market, and their greatest skill is crystallizing that vision into a narrative that attracts talent, capital, and users.',
    strengths: [
      'Sets ambitious product direction that inspires teams and attracts top talent',
      'Thinks from first principles rather than incremental iteration',
      'Connects market shifts and technology trends to product opportunity',
      'Creates compelling product narratives that align diverse stakeholders',
    ],
    blindSpots: [
      'Can struggle with the messy, incremental execution required to realize a big vision',
      'May dismiss data-driven approaches as too incremental or narrow',
      'Risk of chasing the next big thing before the current thing is fully built',
    ],
    growthEdge: 'Pair your vision with execution systems. The best ideas die in the gap between strategy and shipping. Find an execution-oriented partner or build that muscle yourself.',
  },
  5: {
    id: 'the-operator',
    name: 'The Operator',
    tagline: 'The complete product leader',
    description: 'Operators are the most well-rounded product leaders in the dataset. They score consistently high across all six dimensions because they\'ve built breadth through diverse experience — often as CPOs, VPs, or multi-stage startup leaders who\'ve had to do it all. They\'re not the single highest scorer on any one dimension, but they\'re never the weakest either. This balanced profile makes them extraordinarily effective at running product organizations, managing up and across, and adapting to whatever challenge the business faces.',
    strengths: [
      'Adapts fluidly between strategic, tactical, and interpersonal modes',
      'Builds trust across engineering, design, marketing, and executive teams',
      'Consistently delivers results across different company stages and problem domains',
      'Serves as a stabilizing force in chaotic, fast-moving organizations',
    ],
    blindSpots: [
      'May lack the spike of depth that specialists bring to hard problems',
      'Can be pulled in too many directions, spreading impact thin',
      'Risk of being "good enough at everything" without developing a signature strength',
    ],
    growthEdge: 'Identify your one dimension you\'re most passionate about and invest disproportionately in it. Your balanced foundation means you can afford to develop a spike — and it will make you distinctive rather than just reliable.',
  },
  6: {
    id: 'the-craftsperson',
    name: 'The Craftsperson',
    tagline: 'The details are the product',
    description: 'Craftspeople believe that product quality is not a feature — it\'s the entire game. They obsess over interaction design, edge cases, performance, and the invisible details that separate good products from great ones. Their bar for "shipped" is higher than most, and they push their teams to care about the 5% that users feel but can\'t articulate. They champion design excellence, writing quality, and the belief that how something works is just as important as what it does.',
    strengths: [
      'Ships products with a level of polish that earns user trust and loyalty',
      'Catches quality issues and edge cases that others miss',
      'Builds strong partnerships with design and engineering by respecting their craft',
      'Creates product culture where quality is non-negotiable, not a nice-to-have',
    ],
    blindSpots: [
      'Can be slow to ship, holding launches for diminishing-return polish',
      'May struggle to prioritize when everything feels like it needs to be perfect',
      'Risk of optimizing existing experiences instead of exploring new opportunities',
    ],
    growthEdge: 'Practice launching before you\'re comfortable. Build your intuition for when quality truly matters versus when speed-to-learning is more valuable. Not every feature needs to be pixel-perfect on day one.',
  },
};

// Build archetypes array with centroid dimensions
const archetypes = clusteringData.centroids.map((centroid: Record<string, number>, i: number) => {
  const def = archetypesByCluster[i];
  if (!def) throw new Error(`No archetype definition for cluster ${i}`);

  // Round centroid values
  const dimensions: Record<string, number> = {};
  for (const id of DIMENSION_IDS) {
    dimensions[id] = Math.round((centroid[id] ?? 0) * 100) / 100;
  }

  return {
    ...def,
    dimensions,
  };
});

// Build archetypes.json
const archetypesJson = {
  version: '1.0.0',
  dimensions: DIMENSION_IDS.map((id) => {
    const labels: Record<string, { name: string; shortName: string; description: string; color: string }> = {
      'strategic-vision': { name: 'Strategic Vision', shortName: 'Vision', description: 'Setting direction, first-principles thinking, long-term bets, market positioning', color: '#6366F1' },
      'execution-craft': { name: 'Execution & Craft', shortName: 'Craft', description: 'Shipping velocity, quality obsession, design excellence, attention to detail', color: '#F59E0B' },
      'data-experimentation': { name: 'Data & Experimentation', shortName: 'Data', description: 'Measurement rigor, A/B testing, evidence-based decisions, metrics', color: '#10B981' },
      'growth-distribution': { name: 'Growth & Distribution', shortName: 'Growth', description: 'Growth loops, PLG, viral mechanics, channels, acquisition strategy', color: '#EF4444' },
      'team-leadership': { name: 'Team & Leadership', shortName: 'Team', description: 'Hiring, culture, coaching, org design, managing up and across', color: '#8B5CF6' },
      'user-empathy': { name: 'User Empathy & Research', shortName: 'Empathy', description: 'Customer obsession, user research, design thinking, jobs-to-be-done', color: '#EC4899' },
    };
    return { id, ...labels[id] };
  }),
  archetypes,
};

writeFileSync(join(OUTPUT_DIR, 'archetypes.json'), JSON.stringify(archetypesJson, null, 2));
console.log(`Archetypes written to ${join(OUTPUT_DIR, 'archetypes.json')}`);
console.log(`${archetypes.length} archetypes defined`);
for (const a of archetypes) {
  console.log(`  ${a.name}: ${DIMENSION_IDS.map((id) => `${id.split('-')[0]}=${a.dimensions[id]}`).join(', ')}`);
}
