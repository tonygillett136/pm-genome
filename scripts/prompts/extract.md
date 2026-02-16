You are analyzing a podcast transcript from Lenny's Podcast, a leading product management and growth podcast.

The guest is: {{guestName}}
{{#if titleFromIntro}}Their role (from intro): {{titleFromIntro}}{{/if}}
{{#if companyFromIntro}}Company: {{companyFromIntro}}{{/if}}

Analyze the full transcript below and return a JSON object with the following fields:

1. **guestMeta**: Object with:
   - `name`: The guest's full name (corrected spelling if needed)
   - `title`: Their job title/role (e.g., "CEO & Co-founder", "VP of Product", "Head of Growth"). If unclear, use "Product Leader" or similar.
   - `company`: The company they're primarily associated with in this conversation.
   - `bio`: A single sentence describing who they are and why they're notable.

2. **keyThemes**: Array of 3-6 concise noun phrases describing the core topics discussed (e.g., "founder-mode leadership", "product-led growth", "jobs-to-be-done framework").

3. **leadershipPrinciples**: Array of 2-4 specific, direct principles this guest advocates. Write them as beliefs they would defend (e.g., "Leaders must stay in the details", "Speed of iteration beats quality of strategy").

4. **dimensionScores**: Score the guest on each of the 6 PM dimensions from 0.0 to 1.0 based ONLY on what they discuss and emphasize in this transcript. A score of 0.8+ means deep expertise, strong emphasis, and detailed advice on that dimension. A score of 0.3 or below means they barely touch on it.

   - `strategic-vision`: Setting direction, first-principles thinking, long-term bets, market positioning, product vision, strategy
   - `execution-craft`: Shipping velocity, quality obsession, design excellence, attention to detail, craft, process
   - `data-experimentation`: Measurement rigor, A/B testing, evidence-based decisions, metrics, analytics
   - `growth-distribution`: Growth loops, PLG, viral mechanics, channels, acquisition, retention, distribution strategy
   - `team-leadership`: Hiring, culture-building, coaching, org design, managing teams, managing up
   - `user-empathy`: Customer obsession, user research, design thinking, jobs-to-be-done, understanding users

5. **notableQuotes**: Array of 3-5 of the most memorable, shareable quotes from the guest. Each with:
   - `text`: The exact or near-exact quote
   - `context`: A brief phrase explaining what they're talking about (e.g., "On why leaders must stay in the details")

6. **episodeSummary**: 2-3 sentences summarizing the episode's key value for a product leader audience.

Return ONLY valid JSON. No markdown fences, no commentary outside the JSON.

---

TRANSCRIPT:

{{transcript}}
