// Lambda handler for POST /ai
// Routes to feedback | clarify | refine via OpenAI Chat Completions.

import { getOpenAIClient } from '../shared/openai.mjs';
import { validateAiRequest } from '../shared/validate.mjs';
import {
  buildFeedbackPrompt,
  buildClarifyPrompt,
  buildRefinePrompt,
} from './prompts.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function respond(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export async function handler(event) {
  // Content-Type guard
  const contentType = event.headers?.['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    return respond(415, { error: 'Content-Type must be application/json' });
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return respond(400, { error: 'Invalid input' });
  }

  // Validate
  const validationError = validateAiRequest(body);
  if (validationError) {
    return respond(400, { error: 'Invalid input' });
  }

  const { action, idea, answers = [], weakAreas = [], totalScore = 0, zone = 'yellow' } = body;

  try {
    const openai = await getOpenAIClient();

    let messages;
    let parseJson = false;

    if (action === 'feedback') {
      messages = buildFeedbackPrompt(idea, weakAreas, totalScore, zone);
    } else if (action === 'clarify') {
      messages = buildClarifyPrompt(idea);
      parseJson = true;
    } else {
      // refine
      const weakAreaIds = Array.isArray(weakAreas)
        ? weakAreas.map((w) => (typeof w === 'string' ? w : w.questionId))
        : [];
      messages = buildRefinePrompt(idea, zone, weakAreaIds);
      parseJson = true;
    }

    const completion = await openai.chat.completions.create({
      // Model is configurable via the OPENAI_MODEL env var (set in template.yaml).
      // Default is gpt-4o-mini — cheap, fast, and compatible with the
      // max_tokens + temperature params below. To use a stronger model
      // (e.g. gpt-4.1, gpt-4.1-mini), set OPENAI_MODEL on the AiFunction and
      // confirm your account has access. Reasoning models may require
      // different params (max_completion_tokens, fixed temperature).
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? '';

    if (parseJson) {
      // clarify and refine return structured JSON
      let parsed;
      try {
        // Strip markdown code fences if the model wrapped the JSON
        const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('Failed to parse JSON from model output:', content);
        return respond(500, { error: 'Internal error' });
      }
      return respond(200, parsed);
    }

    // feedback returns markdown string
    return respond(200, { markdown: content });

  } catch (err) {
    console.error('AI Lambda error:', err);
    return respond(500, { error: 'Internal error' });
  }
}
