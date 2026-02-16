You are designing a product leadership assessment quiz inspired by real scenarios from Lenny's Podcast interviews with 280+ product leaders.

## Constraints
- 24 questions total, 4 per dimension
- Each question presents a realistic product scenario in 2-3 sentences
- Each question has exactly 4 options (1-2 sentences each)
- Each option should feel like a reasonable, smart response — no obviously "wrong" answers
- Each option has a PRIMARY dimension it measures (weight: 1.0) and 1-3 SECONDARY dimensions (weights: 0.1-0.3)
- Within each question, each option should have a DIFFERENT primary dimension
- Questions should progress in difficulty:
  - Q1-Q8: "The Daily Grind" — common PM situations, accessible
  - Q9-Q16: "The Hard Tradeoffs" — genuine tensions, no obvious right answer
  - Q17-Q24: "The Defining Moments" — high-stakes, career-shaping situations
- Write scenarios in second person ("You are...", "Your team...")
- Keep scenarios to 2-3 sentences max
- Keep options to 1-2 sentences max

## The 6 Dimensions
- **strategic-vision**: Setting direction, first-principles thinking, long-term bets, market positioning
- **execution-craft**: Shipping velocity, quality obsession, design excellence, attention to detail
- **data-experimentation**: Measurement rigor, A/B testing, evidence-based decisions, metrics
- **growth-distribution**: Growth loops, PLG, viral mechanics, channels, acquisition strategy
- **team-leadership**: Hiring, culture, coaching, org design, managing teams
- **user-empathy**: Customer obsession, user research, design thinking, jobs-to-be-done

## The 7 Archetypes (for context, to help you design discriminating questions)
{{archetypes}}

## Example Question Format
```json
{
  "id": "q01",
  "scenario": "Your company's biggest feature launch in a year just shipped. Two weeks in, the core metric hasn't moved at all.",
  "tier": 1,
  "options": [
    {
      "id": "q01-a",
      "text": "Pull the launch data apart segment by segment — the aggregate might be hiding a win in one cohort and a loss in another.",
      "weights": {
        "strategic-vision": 0.1,
        "execution-craft": 0.2,
        "data-experimentation": 1.0,
        "growth-distribution": 0.3,
        "team-leadership": 0.0,
        "user-empathy": 0.2
      }
    }
  ]
}
```

## Important
- Every dimension must appear as the primary weight (1.0) in at least 16 total options across all 24 questions
- Randomize which option slot (a/b/c/d) maps to which dimension — don't always make "a" the same dimension
- Make options feel genuinely different from each other, not just slight variations
- Draw inspiration from real situations discussed on the podcast (product-market fit dilemmas, hiring decisions, growth vs. quality tradeoffs, stakeholder conflicts, scaling challenges)

Generate all 24 questions as a JSON array. Return ONLY valid JSON, no markdown fences, no commentary.
