import type { Answer, Question, ScoreResult, ScoreZone, WeakArea } from '../types';
import { WEAK_AREA_THRESHOLD, ZONE_THRESHOLDS } from '../config/questions';

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/**
 * Converts a raw answer value to a normalised score in [0, 1].
 * The normalisation depends on the question's answerType and direction.
 */
function normalise(question: Question, rawValue: Answer['value']): number {
  switch (question.answerType) {
    case 'scale': {
      // Raw value is a number in [0, 10].
      const n = (rawValue as number) / 10;
      // If direction is 'negative', a high raw value is bad → invert.
      return question.direction === 'negative' ? 1 - n : n;
    }

    case 'yes_no': {
      // true (yes) = 1, false (no) = 0
      return (rawValue as boolean) ? 1 : 0;
    }

    case 'multiple_choice': {
      const option = (question.options ?? []).find(
        (o) => o.value === (rawValue as string),
      );
      return option?.normalizedScore ?? 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Zone classifier
// ---------------------------------------------------------------------------

function classifyZone(totalScore: number): ScoreZone {
  if (totalScore < ZONE_THRESHOLDS.RED_MAX) return 'red';
  if (totalScore < ZONE_THRESHOLDS.YELLOW_MAX) return 'yellow';
  return 'green';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure, side-effect-free scoring function.
 *
 * @param answers  – Array of user answers, one per question.
 *                   Questions without a corresponding answer are skipped
 *                   (treated as if they contribute 0 to the weighted sum).
 * @param questions – Full question list from config, providing weights and
 *                   meta-data needed to interpret the answers.
 *
 * @returns A {@link ScoreResult} with totalScore [0–100], zone, weak areas,
 *          and per-dimension scores.
 */
export function calculateScore(
  answers: Answer[],
  questions: Question[],
): ScoreResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);

  const dimensionScores: Record<string, number> = {};
  let weightedSum = 0;

  for (const question of questions) {
    const answer = answerMap.get(question.id);
    if (!answer) continue;

    const norm = normalise(question, answer.value);
    dimensionScores[question.id] = norm;
    weightedSum += norm * question.weight;
  }

  const totalScore =
    totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  const weakAreas: WeakArea[] = questions
    .filter(
      (q) =>
        q.id in dimensionScores &&
        dimensionScores[q.id] < WEAK_AREA_THRESHOLD,
    )
    .sort((a, b) => dimensionScores[a.id] - dimensionScores[b.id])
    .map((q) => ({
      questionId: q.id,
      questionText: q.text,
      normalizedScore: dimensionScores[q.id],
      explanation: q.weakZoneText,
    }));

  return {
    totalScore,
    zone: classifyZone(totalScore),
    weakAreas,
    dimensionScores,
  };
}
