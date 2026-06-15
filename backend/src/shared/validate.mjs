// Pure input validation helpers used by the AI Lambda.
// Returns null on success, or a string describing the error.
//
// Limits are intentionally strict to bound the size of the prompt sent to
// OpenAI — this protects against token-amplification abuse where a caller
// inflates fields like weakAreas[].explanation to drive up cost.

const VALID_ACTIONS = new Set(['feedback', 'clarify', 'refine']);
const VALID_ZONES = new Set(['red', 'yellow', 'green']);

const MAX_IDEA_LEN = 500;
const MAX_ANSWERS = 8;
const MAX_WEAK_AREAS = 8;
const MAX_QUESTION_ID_LEN = 60;
const MAX_EXPLANATION_LEN = 300;

/**
 * Validate the parsed request body for POST /ai.
 * @param {unknown} body
 * @returns {string|null} error message, or null if valid
 */
export function validateAiRequest(body) {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object';

  const { action, idea, answers, weakAreas, zone, totalScore } =
    /** @type {Record<string, unknown>} */ (body);

  if (!VALID_ACTIONS.has(action)) {
    return `action must be one of: ${[...VALID_ACTIONS].join(', ')}`;
  }

  if (typeof idea !== 'string' || idea.trim().length === 0) {
    return 'idea must be a non-empty string';
  }

  if (idea.length > MAX_IDEA_LEN) {
    return `idea must be ${MAX_IDEA_LEN} characters or fewer`;
  }

  if (answers !== undefined) {
    if (!Array.isArray(answers)) return 'answers must be an array';
    if (answers.length > MAX_ANSWERS) return `answers must contain ${MAX_ANSWERS} items or fewer`;
  }

  if (zone !== undefined && !VALID_ZONES.has(zone)) {
    return 'zone is invalid';
  }

  if (totalScore !== undefined) {
    if (typeof totalScore !== 'number' || totalScore < 0 || totalScore > 100) {
      return 'totalScore must be a number between 0 and 100';
    }
  }

  if (weakAreas !== undefined) {
    if (!Array.isArray(weakAreas)) return 'weakAreas must be an array';
    if (weakAreas.length > MAX_WEAK_AREAS) {
      return `weakAreas must contain ${MAX_WEAK_AREAS} items or fewer`;
    }
    for (const w of weakAreas) {
      // refine sends string ids; feedback sends objects — both are bounded here
      if (typeof w === 'string') {
        if (w.length > MAX_QUESTION_ID_LEN) return 'weakArea id is too long';
        continue;
      }
      if (!w || typeof w !== 'object') return 'weakArea must be a string or object';
      if (typeof w.questionId !== 'string' || w.questionId.length > MAX_QUESTION_ID_LEN) {
        return 'weakArea.questionId is invalid';
      }
      if (w.explanation !== undefined) {
        if (typeof w.explanation !== 'string' || w.explanation.length > MAX_EXPLANATION_LEN) {
          return 'weakArea.explanation is too long';
        }
      }
    }
  }

  return null;
}

/**
 * Validate the parsed request body for POST /events.
 * Returns true if valid (invalid events are silently dropped, not rejected).
 * @param {unknown} body
 * @returns {boolean}
 */
export function validateEventRequest(body) {
  if (!body || typeof body !== 'object') return false;
  const { sessionId, event, ts } = /** @type {Record<string, unknown>} */ (body);
  return (
    typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= 64 &&
    typeof event === 'string' && event.length > 0 && event.length <= 64 &&
    typeof ts === 'number'
  );
}
