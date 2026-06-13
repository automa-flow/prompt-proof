// ---------------------------------------------------------------------------
// Core data types for AI-Era Idea Filter
// ---------------------------------------------------------------------------

/** How the user answers a single question. */
export type AnswerType = 'scale' | 'yes_no' | 'multiple_choice';

/** A single option inside a multiple_choice question. */
export interface ChoiceOption {
  /** Unique key used as the answer value. */
  value: string;
  /** Human-readable label shown to the user. */
  label: string;
  /**
   * Normalised score contribution [0, 1] this option contributes.
   * 1 = strongest positive signal, 0 = strongest negative signal.
   */
  normalizedScore: number;
}

/**
 * A single question in the quiz.
 * Content lives in `src/config/questions.ts` — change wording there without
 * touching any logic or UI code.
 */
export interface Question {
  /** Unique string identifier, e.g. "ai_substitutability". */
  id: string;
  /** Main question text shown to the user. */
  text: string;
  /** Optional short clarification shown below the question. */
  description?: string;
  /** Determines which answer widget is rendered. */
  answerType: AnswerType;
  /**
   * Relative importance of this question in the total score.
   * All weights are summed and each question's contribution is
   * `(weight / totalWeight) * normalizedAnswer * 100`.
   */
  weight: number;
  /**
   * For 'scale' questions: how to interpret the slider.
   * 'positive' → high value = good score.
   * 'negative' → high value = bad score (value is inverted before scoring).
   */
  direction?: 'positive' | 'negative';
  /** Options list — required when answerType === 'multiple_choice'. */
  options?: ChoiceOption[];
  /** Explanation shown when this question lands in the "weak" zone. */
  weakZoneText: string;
  /** Explanation shown when this question lands in the "strong" zone. */
  strongZoneText: string;
}

// ---------------------------------------------------------------------------
// Scoring output types
// ---------------------------------------------------------------------------

/** Overall result band. */
export type ScoreZone = 'red' | 'yellow' | 'green';

/** Detail for a single dimension that pulled the score down. */
export interface WeakArea {
  questionId: string;
  questionText: string;
  /** Normalised score [0, 1] for this dimension. */
  normalizedScore: number;
  /** Human-readable explanation sourced from question.weakZoneText. */
  explanation: string;
}

/** Full output of the scoring function. */
export interface ScoreResult {
  /** Final weighted score in the range [0, 100]. */
  totalScore: number;
  /** Categorical zone derived from totalScore. */
  zone: ScoreZone;
  /**
   * Questions whose normalised score is below the weak threshold (0.4).
   * Sorted from worst to best (ascending normalizedScore).
   */
  weakAreas: WeakArea[];
  /**
   * Map of questionId → normalizedScore for per-dimension display.
   */
  dimensionScores: Record<string, number>;
}

// ---------------------------------------------------------------------------
// User-supplied answers (runtime state)
// ---------------------------------------------------------------------------

/**
 * A single answer recorded during the quiz session.
 * Values are stored in their raw form; the scoring function normalises them.
 */
export interface Answer {
  questionId: string;
  /**
   * Raw value as emitted by the answer widget:
   * - scale: number in [0, 10]
   * - yes_no: boolean
   * - multiple_choice: the ChoiceOption.value string
   */
  value: number | boolean | string;
}

// ---------------------------------------------------------------------------
// AI service response types
// ---------------------------------------------------------------------------

/** Response from action='feedback' — a markdown-formatted idea analysis. */
export interface AiFeedbackResponse {
  markdown: string;
}

/** Response from action='clarify' — 1-2 clarifying questions. */
export interface ClarifyResponse {
  questions: string[];
}

/** Response from action='refine' — improved idea text + AI risk notes. */
export interface RefineResponse {
  refinedIdea: string;
  aiRiskNotes: string;
}

// ---------------------------------------------------------------------------
// Analytics event payload
// ---------------------------------------------------------------------------

export interface AnalyticsEvent {
  sessionId: string;
  event: string;
  props?: Record<string, unknown>;
  ts: number;
}
