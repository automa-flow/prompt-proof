// Tests for the pure request validators. Dependency-free — run with `node --test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAiRequest, validateEventRequest } from './validate.mjs';

// ── validateAiRequest ──────────────────────────────────────────────────────

test('accepts a minimal valid feedback request', () => {
  assert.equal(validateAiRequest({ action: 'feedback', idea: 'A note-taking app' }), null);
});

test('accepts each valid action', () => {
  for (const action of ['feedback', 'clarify', 'refine']) {
    assert.equal(validateAiRequest({ action, idea: 'idea' }), null, action);
  }
});

test('rejects an unknown action', () => {
  assert.match(validateAiRequest({ action: 'nope', idea: 'idea' }), /action must be one of/);
});

test('rejects a non-object body', () => {
  assert.equal(validateAiRequest(null), 'Body must be a JSON object');
  assert.equal(validateAiRequest('string'), 'Body must be a JSON object');
});

test('rejects an empty or non-string idea', () => {
  assert.match(validateAiRequest({ action: 'feedback', idea: '' }), /non-empty string/);
  assert.match(validateAiRequest({ action: 'feedback', idea: '   ' }), /non-empty string/);
  assert.match(validateAiRequest({ action: 'feedback', idea: 42 }), /non-empty string/);
});

test('enforces the 500-char idea limit', () => {
  assert.equal(validateAiRequest({ action: 'feedback', idea: 'x'.repeat(500) }), null);
  assert.match(
    validateAiRequest({ action: 'feedback', idea: 'x'.repeat(501) }),
    /500 characters or fewer/,
  );
});

test('accepts weakAreas as string ids (refine shape)', () => {
  assert.equal(
    validateAiRequest({ action: 'refine', idea: 'idea', weakAreas: ['ai_substitutability', 'unique_moat'] }),
    null,
  );
});

test('accepts weakAreas as objects (feedback shape) and bounds explanation length', () => {
  assert.equal(
    validateAiRequest({
      action: 'feedback',
      idea: 'idea',
      weakAreas: [{ questionId: 'unique_moat', explanation: 'short', normalizedScore: 0.1 }],
    }),
    null,
  );
  assert.match(
    validateAiRequest({
      action: 'feedback',
      idea: 'idea',
      weakAreas: [{ questionId: 'unique_moat', explanation: 'x'.repeat(301) }],
    }),
    /explanation is too long/,
  );
});

test('rejects too many weakAreas', () => {
  const tooMany = Array.from({ length: 9 }, () => 'id');
  assert.match(
    validateAiRequest({ action: 'feedback', idea: 'idea', weakAreas: tooMany }),
    /8 items or fewer/,
  );
});

test('rejects an invalid zone and out-of-range totalScore', () => {
  assert.equal(validateAiRequest({ action: 'feedback', idea: 'idea', zone: 'purple' }), 'zone is invalid');
  assert.match(
    validateAiRequest({ action: 'feedback', idea: 'idea', totalScore: 101 }),
    /between 0 and 100/,
  );
});

// ── validateEventRequest ─────────────────────────────────────────────────────

test('accepts a well-formed event', () => {
  assert.equal(validateEventRequest({ sessionId: 'abc', event: 'quiz_started', ts: Date.now() }), true);
});

test('rejects events with missing or oversized fields', () => {
  assert.equal(validateEventRequest({ event: 'x', ts: 1 }), false);
  assert.equal(validateEventRequest({ sessionId: 'x', ts: 1 }), false);
  assert.equal(validateEventRequest({ sessionId: 'x', event: 'x' }), false);
  assert.equal(validateEventRequest({ sessionId: 'x'.repeat(65), event: 'x', ts: 1 }), false);
  assert.equal(validateEventRequest(null), false);
});
