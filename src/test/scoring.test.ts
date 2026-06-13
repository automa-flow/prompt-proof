import { describe, it, expect } from 'vitest';
import { calculateScore } from '../logic/scoring';
import type { Answer, Question } from '../types';

// ---------------------------------------------------------------------------
// Minimal question fixtures (independent of the live config so tests don't
// break when question wording is updated).
// ---------------------------------------------------------------------------

const SCALE_POS: Question = {
  id: 'scale_pos',
  text: 'How strong is your moat?',
  answerType: 'scale',
  weight: 10,
  direction: 'positive',
  weakZoneText: 'Weak moat explanation.',
  strongZoneText: 'Strong moat explanation.',
};

const SCALE_NEG: Question = {
  id: 'scale_neg',
  text: 'How replaceable is your value?',
  answerType: 'scale',
  weight: 10,
  direction: 'negative',
  weakZoneText: 'High AI substitutability explanation.',
  strongZoneText: 'Low AI substitutability explanation.',
};

const YES_NO: Question = {
  id: 'yes_no',
  text: 'Do you have a distribution path?',
  answerType: 'yes_no',
  weight: 10,
  weakZoneText: 'No distribution path explanation.',
  strongZoneText: 'Has distribution path explanation.',
};

const CHOICE: Question = {
  id: 'choice',
  text: 'What is your monetisation plan?',
  answerType: 'multiple_choice',
  weight: 10,
  options: [
    { value: 'clear', label: 'Clear model', normalizedScore: 1.0 },
    { value: 'rough', label: 'Rough idea',  normalizedScore: 0.5 },
    { value: 'none',  label: 'No idea',     normalizedScore: 0.0 },
  ],
  weakZoneText: 'No monetisation plan explanation.',
  strongZoneText: 'Clear monetisation plan explanation.',
};

const ALL_QUESTIONS = [SCALE_POS, SCALE_NEG, YES_NO, CHOICE];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeAnswers(overrides: Partial<Record<string, Answer['value']>>): Answer[] {
  const defaults: Record<string, Answer['value']> = {
    scale_pos: 10,
    scale_neg: 0,
    yes_no: true,
    choice: 'clear',
  };
  const merged = { ...defaults, ...overrides };
  return Object.entries(merged)
    .filter((entry): entry is [string, Answer['value']] => entry[1] !== undefined)
    .map(([questionId, value]) => ({ questionId, value }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateScore', () => {
  it('returns 100 for perfect answers', () => {
    const answers = makeAnswers({});
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.totalScore).toBe(100);
    expect(result.zone).toBe('green');
    expect(result.weakAreas).toHaveLength(0);
  });

  it('returns 0 for worst-case answers', () => {
    const answers = makeAnswers({
      scale_pos: 0,
      scale_neg: 10,
      yes_no: false,
      choice: 'none',
    });
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.totalScore).toBe(0);
    expect(result.zone).toBe('red');
    expect(result.weakAreas).toHaveLength(ALL_QUESTIONS.length);
  });

  // ── normalisation ──────────────────────────────────────────────────────

  it('inverts scale value for negative-direction questions', () => {
    // scale_neg raw = 10 (worst) should give dimensionScore = 0
    const answers = makeAnswers({ scale_neg: 10 });
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.dimensionScores['scale_neg']).toBe(0);
  });

  it('does NOT invert scale value for positive-direction questions', () => {
    const answers = makeAnswers({ scale_pos: 10 });
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.dimensionScores['scale_pos']).toBe(1);
  });

  it('maps yes_no true → 1 and false → 0', () => {
    const trueResult = calculateScore(makeAnswers({ yes_no: true }), ALL_QUESTIONS);
    expect(trueResult.dimensionScores['yes_no']).toBe(1);

    const falseResult = calculateScore(makeAnswers({ yes_no: false }), ALL_QUESTIONS);
    expect(falseResult.dimensionScores['yes_no']).toBe(0);
  });

  it('maps multiple_choice value to correct normalizedScore', () => {
    const roughResult = calculateScore(makeAnswers({ choice: 'rough' }), ALL_QUESTIONS);
    expect(roughResult.dimensionScores['choice']).toBe(0.5);
  });

  // ── weak areas ──────────────────────────────────────────────────────────

  it('flags dimensions below the weak threshold as weak areas', () => {
    // scale_pos = 3 → normalised = 0.3, below threshold 0.4
    const answers = makeAnswers({ scale_pos: 3 });
    const result = calculateScore(answers, ALL_QUESTIONS);
    const ids = result.weakAreas.map((w) => w.questionId);
    expect(ids).toContain('scale_pos');
  });

  it('does NOT flag dimensions above the weak threshold', () => {
    // scale_pos = 5 → normalised = 0.5, above threshold 0.4
    const answers = makeAnswers({ scale_pos: 5 });
    const result = calculateScore(answers, ALL_QUESTIONS);
    const ids = result.weakAreas.map((w) => w.questionId);
    expect(ids).not.toContain('scale_pos');
  });

  it('sorts weak areas ascending by normalizedScore (worst first)', () => {
    const answers = makeAnswers({ scale_pos: 0, scale_neg: 8 }); // both weak
    const result = calculateScore(answers, ALL_QUESTIONS);
    const weakIds = result.weakAreas.map((w) => w.questionId);
    expect(weakIds).toContain('scale_pos');   // 0.0
    expect(weakIds).toContain('scale_neg');   // 0.2 (1 - 0.8)
    // scale_pos should appear before scale_neg (lower score = worse)
    expect(weakIds.indexOf('scale_pos')).toBeLessThan(weakIds.indexOf('scale_neg'));
  });

  it('includes explanation text from the question config', () => {
    const answers = makeAnswers({ scale_pos: 0 }); // weak
    const result = calculateScore(answers, ALL_QUESTIONS);
    const area = result.weakAreas.find((w) => w.questionId === 'scale_pos');
    expect(area?.explanation).toBe(SCALE_POS.weakZoneText);
  });

  // ── zone boundaries ─────────────────────────────────────────────────────

  it('returns zone "red" for totalScore < 40', () => {
    // Force a ~25 score: only scale_pos = 0 answered, all others = worst
    const answers = makeAnswers({ scale_pos: 0, scale_neg: 10, yes_no: false, choice: 'none' });
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.zone).toBe('red');
  });

  it('returns zone "yellow" for totalScore between 40 and 69', () => {
    // Mixed answers yielding a mid-range score
    const answers: Answer[] = [
      { questionId: 'scale_pos', value: 5 }, // 0.5
      { questionId: 'scale_neg', value: 5 }, // 0.5
      { questionId: 'yes_no',    value: true },  // 1
      { questionId: 'choice',    value: 'rough' }, // 0.5
    ];
    const result = calculateScore(answers, ALL_QUESTIONS);
    // (0.5*10 + 0.5*10 + 1*10 + 0.5*10) / 40 * 100 = 62.5 → 63
    expect(result.zone).toBe('yellow');
  });

  it('returns zone "green" for totalScore >= 70', () => {
    const answers = makeAnswers({});
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.zone).toBe('green');
  });

  // ── edge cases ──────────────────────────────────────────────────────────

  it('returns score 0 when no answers are provided', () => {
    const result = calculateScore([], ALL_QUESTIONS);
    expect(result.totalScore).toBe(0);
  });

  it('ignores answers for unknown question IDs', () => {
    const answers: Answer[] = [
      ...makeAnswers({}),
      { questionId: 'unknown_id', value: 5 },
    ];
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.totalScore).toBe(100); // unknown answer has no effect
  });

  it('handles missing multiple_choice option gracefully (defaults to 0)', () => {
    const answers = makeAnswers({ choice: 'nonexistent_value' });
    const result = calculateScore(answers, ALL_QUESTIONS);
    expect(result.dimensionScores['choice']).toBe(0);
  });
});
