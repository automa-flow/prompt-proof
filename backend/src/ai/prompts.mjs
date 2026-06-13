// Prompt builders for the three AI actions.
// Each function returns an array of OpenAI chat messages.

/**
 * Builds the feedback prompt.
 * Returns 3-5 actionable markdown bullet points analysing weak areas.
 *
 * @param {string} idea
 * @param {{ questionId: string; explanation: string; normalizedScore: number }[]} weakAreas
 * @param {number} totalScore
 * @param {string} zone
 * @returns {{ role: string; content: string }[]}
 */
export function buildFeedbackPrompt(idea, weakAreas, totalScore, zone) {
  const weakList = weakAreas
    .map((w) => `- ${w.questionId} (score ${(w.normalizedScore * 10).toFixed(1)}/10): ${w.explanation}`)
    .join('\n');

  return [
    {
      role: 'system',
      content:
        'You are a sharp startup advisor helping founders evaluate side projects in the AI era. ' +
        'Be direct, specific, and constructive. Respond in the same language as the idea description. ' +
        'Format your response as markdown with short bullet points (no headers).',
    },
    {
      role: 'user',
      content:
        `Idea: "${idea}"\n` +
        `Overall score: ${totalScore}/100 (zone: ${zone})\n\n` +
        `Weak areas detected:\n${weakList || '(none)'}\n\n` +
        'Give 3–5 concise, actionable recommendations to strengthen this idea against AI disruption and platform risk. ' +
        'Focus on the weakest dimensions above. Be specific — no generic advice.',
    },
  ];
}

/**
 * Builds the clarify prompt.
 * Returns 1-2 sharp follow-up questions to sharpen the idea.
 *
 * @param {string} idea
 * @returns {{ role: string; content: string }[]}
 */
export function buildClarifyPrompt(idea) {
  return [
    {
      role: 'system',
      content:
        'You are a startup advisor helping founders sharpen their side-project ideas. ' +
        'Respond in the same language as the idea. ' +
        'Output ONLY a JSON object: { "questions": ["...", "..."] } — exactly 1 or 2 questions, no other text.',
    },
    {
      role: 'user',
      content:
        `Idea: "${idea}"\n\n` +
        'Ask 1–2 short, pointed clarifying questions that would most help sharpen the definition of this idea ' +
        'before evaluating its AI-era viability. Focus on the most ambiguous aspect.',
    },
  ];
}

/**
 * Builds the refine prompt.
 * Returns a stronger idea formulation and AI-risk reduction notes.
 *
 * @param {string} idea
 * @param {string} zone
 * @param {string[]} weakAreaIds
 * @returns {{ role: string; content: string }[]}
 */
export function buildRefinePrompt(idea, zone, weakAreaIds) {
  return [
    {
      role: 'system',
      content:
        'You are a startup advisor helping founders reframe side-project ideas to be more resilient in the AI era. ' +
        'Respond in the same language as the idea. ' +
        'Output ONLY a JSON object: { "refinedIdea": "...", "aiRiskNotes": "..." } — no other text.',
    },
    {
      role: 'user',
      content:
        `Original idea: "${idea}"\n` +
        `Current risk zone: ${zone}\n` +
        `Weakest dimensions: ${weakAreaIds.join(', ') || '(none)'}\n\n` +
        'Rewrite the idea in one sentence to emphasise the human, community, or workflow layer that AI cannot easily replace. ' +
        'Then in 1–2 sentences explain how to reduce the AI substitution risk specifically for this idea.',
    },
  ];
}
