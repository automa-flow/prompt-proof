// Pure input validation helpers used by the AI Lambda.
// Returns null on success, or a string describing the error.

const VALID_ACTIONS = new Set(['feedback', 'clarify', 'refine']);

/**
 * Validate the parsed request body for POST /ai.
 * @param {unknown} body
 * @returns {string|null} error message, or null if valid
 */
export function validateAiRequest(body) {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object';

  const { action, idea, answers } = /** @type {Record<string, unknown>} */ (body);

  if (!VALID_ACTIONS.has(action)) {
    return `action must be one of: ${[...VALID_ACTIONS].join(', ')}`;
  }

  if (typeof idea !== 'string' || idea.trim().length === 0) {
    return 'idea must be a non-empty string';
  }

  if (idea.length > 500) {
    return 'idea must be 500 characters or fewer';
  }

  if (answers !== undefined) {
    if (!Array.isArray(answers)) return 'answers must be an array';
    if (answers.length > 8) return 'answers must contain 8 items or fewer';
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
    typeof sessionId === 'string' && sessionId.length > 0 &&
    typeof event === 'string' && event.length > 0 &&
    typeof ts === 'number'
  );
}
