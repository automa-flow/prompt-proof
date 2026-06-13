import type { Question } from '../types';

/**
 * Content configuration for all quiz questions.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW TO EDIT
 * • Change `text`, `description`, `weakZoneText`, `strongZoneText` freely.
 * • Adjust `weight` (positive integer) to change relative importance.
 * • For scale questions, set `direction`:
 *     'positive' → high slider value = good (e.g. "how unique is your moat?")
 *     'negative' → high slider value = bad  (e.g. "how easy is AI to replace you?")
 * • For multiple_choice questions, each option carries its own `normalizedScore`.
 * • Do NOT change `id` values — they are referenced by the scoring logic.
 * ──────────────────────────────────────────────────────────────────────────
 */
export const QUESTIONS: Question[] = [
  // ── Q1 ──────────────────────────────────────────────────────────────────
  {
    id: 'ai_substitutability',
    text: '[Placeholder Q1] How easily could an AI tool replace the core value your project delivers?',
    description: 'Think about the main job your project does for users — can a chatbot or AI agent do that job today?',
    answerType: 'scale',
    weight: 20,
    direction: 'negative',
    weakZoneText:
      'The core value of your project is highly substitutable by existing AI tools. Consider what layer of insight, taste, curation, or human trust you can add that AI cannot replicate cheaply.',
    strongZoneText:
      'Your core value appears resistant to direct AI substitution — a meaningful moat for the near term.',
  },

  // ── Q2 ──────────────────────────────────────────────────────────────────
  {
    id: 'platform_dependency',
    text: '[Placeholder Q2] How dependent is your project on a single external platform or API?',
    description: 'Examples: App Store, Twitter API, Google Search ranking, Stripe, GitHub.',
    answerType: 'scale',
    weight: 15,
    direction: 'negative',
    weakZoneText:
      'Heavy reliance on one platform creates existential risk — platforms change pricing, policies, or algorithms with little notice. Identify which dependency is most critical and plan a mitigation.',
    strongZoneText:
      'Your project has healthy platform diversification or owns its primary distribution channel.',
  },

  // ── Q3 ──────────────────────────────────────────────────────────────────
  {
    id: 'unique_moat',
    text: '[Placeholder Q3] How strong is your unique advantage (data, community, brand, workflow integration)?',
    description: 'A moat is something that gets stronger over time and is hard for a well-funded competitor to copy quickly.',
    answerType: 'scale',
    weight: 15,
    direction: 'positive',
    weakZoneText:
      'The project lacks a durable competitive advantage. Without a moat, copycats — especially AI-powered ones — will erode your position quickly. Think about network effects, proprietary data, or deep integrations.',
    strongZoneText:
      'You have identified a meaningful moat that should compound over time.',
  },

  // ── Q4 ──────────────────────────────────────────────────────────────────
  {
    id: 'audience_clarity',
    text: '[Placeholder Q4] How clearly defined is your target audience?',
    description: 'Can you name a specific person, role, or community who will use this — and explain why they cannot easily get the same result elsewhere?',
    answerType: 'scale',
    weight: 10,
    direction: 'positive',
    weakZoneText:
      'A vague audience makes every subsequent decision harder — messaging, distribution, and feature prioritisation all suffer. Narrow to a specific persona before building.',
    strongZoneText:
      'You have a sharply defined audience, which keeps scope focused and marketing efficient.',
  },

  // ── Q5 ──────────────────────────────────────────────────────────────────
  {
    id: 'distribution_path',
    text: '[Placeholder Q5] Do you have a clear, realistic path to reaching your first 100 users?',
    answerType: 'yes_no',
    weight: 15,
    weakZoneText:
      '"Build it and they will come" rarely works. Without a concrete acquisition channel (community, SEO, existing audience, partnerships), even a great product stalls at zero.',
    strongZoneText:
      'You have a concrete distribution strategy — a strong signal of execution readiness.',
  },

  // ── Q6 ──────────────────────────────────────────────────────────────────
  {
    id: 'monetisation_path',
    text: '[Placeholder Q6] How clear is the path from free users to revenue (if monetisation is a goal)?',
    answerType: 'multiple_choice',
    weight: 10,
    options: [
      { value: 'not_needed', label: 'Not needed — this is a free tool / OSS', normalizedScore: 0.8 },
      { value: 'clear',      label: 'Clear — I know the pricing model',        normalizedScore: 1.0 },
      { value: 'rough',      label: 'Rough idea — ads, sponsorship, or SaaS someday', normalizedScore: 0.5 },
      { value: 'none',       label: 'No idea yet',                              normalizedScore: 0.1 },
    ],
    weakZoneText:
      'Without a monetisation hypothesis it is hard to sustain the project. Even a loose plan (sponsorship, consulting, freemium) keeps you focused on value creation.',
    strongZoneText:
      'You have a clear view of how value creation converts to revenue or sustainability.',
  },

  // ── Q7 ──────────────────────────────────────────────────────────────────
  {
    id: 'time_to_value',
    text: '[Placeholder Q7] How quickly can a new user experience the core value of your project?',
    answerType: 'scale',
    weight: 10,
    direction: 'positive',
    weakZoneText:
      'Long onboarding kills conversion. If a user does not experience value within minutes, they will not return. Identify the shortest possible path to the "aha moment".',
    strongZoneText:
      'Your project delivers value quickly — an important retention advantage.',
  },

  // ── Q8 ──────────────────────────────────────────────────────────────────
  {
    id: 'founder_fit',
    text: '[Placeholder Q8] How well does this project match your skills, interests, and available time?',
    description: 'Side projects succeed when they sit at the intersection of what you know, what you enjoy, and what you can sustain.',
    answerType: 'scale',
    weight: 5,
    direction: 'positive',
    weakZoneText:
      'A significant skills or motivation gap increases the risk of abandonment. Consider whether a co-founder, a smaller scope, or a different idea better matches your situation.',
    strongZoneText:
      'Strong founder-fit is one of the best predictors of side-project follow-through.',
  },
];

/** Threshold below which a dimension is flagged as a weak area (0–1 scale). */
export const WEAK_AREA_THRESHOLD = 0.4;

/**
 * Score zone boundaries.
 * totalScore < RED_MAX  → 'red'
 * totalScore < YELLOW_MAX → 'yellow'
 * otherwise              → 'green'
 */
export const ZONE_THRESHOLDS = {
  RED_MAX: 40,
  YELLOW_MAX: 70,
} as const;
