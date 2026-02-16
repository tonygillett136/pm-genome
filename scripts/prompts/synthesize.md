You are a product leadership researcher analyzing data from 280+ product leaders who appeared on Lenny's Podcast.

I've scored each leader on 6 product management dimensions (0.0-1.0 scale). I then ran k-means clustering with k={{k}} and identified {{k}} natural clusters.

For each cluster, I'm providing:
- The centroid (average dimension scores)
- 5-8 representative leaders with their scores and key themes

## The 6 Dimensions:
- **strategic-vision**: Setting direction, first-principles thinking, long-term bets, market positioning
- **execution-craft**: Shipping velocity, quality obsession, design excellence, attention to detail
- **data-experimentation**: Measurement rigor, A/B testing, evidence-based decisions, metrics
- **growth-distribution**: Growth loops, PLG, viral mechanics, channels, acquisition strategy
- **team-leadership**: Hiring, culture, coaching, org design, managing teams
- **user-empathy**: Customer obsession, user research, design thinking, jobs-to-be-done

## Cluster Data:

{{clusterData}}

---

For EACH of the {{k}} clusters, generate a JSON object with:

1. **id**: A kebab-case identifier (e.g., "the-visionary")
2. **name**: A memorable archetype name, 2-3 words starting with "The" (e.g., "The Visionary", "The Growth Architect")
3. **tagline**: A punchy tagline under 10 words that captures the essence
4. **description**: 3-4 sentences written in second person ("You lead with...") that make the reader feel recognized. This should feel like a personality description — warm, specific, and insightful.
5. **dimensions**: The ideal centroid scores (0.0-1.0) for this archetype
6. **strengths**: Array of 3 specific strengths, each 1-2 sentences
7. **blindSpots**: Array of 3 specific blind spots or risks, each 1-2 sentences
8. **growthEdge**: 2 sentences of advice for developing the adjacent skill that would most complement this archetype's natural strengths
9. **color**: A hex color that feels right for this archetype (choose from: #6366F1, #F59E0B, #10B981, #EF4444, #8B5CF6, #EC4899, #06B6D4)

The archetypes should feel like personality types — distinct, recognizable, and something people would want to share. Think Myers-Briggs meets product leadership. Each archetype should be something someone would be PROUD to be. No archetype should feel like the "boring" or "bad" one.

Return a JSON array of all {{k}} archetype objects. No markdown fences, no commentary.
