export function buildStateUpdatePrompt({
  problem,
  previousSteps,
  currentStep,
  currentState,
  topic,
}) {
  const steps = Array.isArray(previousSteps) ? previousSteps : [];
  const safeTopic = topic || 'general';

  return `
You are a math tutor. The student provided a CORRECT step. Your job is to update the "current working state" for the next turn.

Rules:
- Do NOT provide the full solution unless asked (this request is NOT asking for a full solution).
- Output MUST be valid JSON only (no markdown, no extra text).
- Return the updated equation/expression in a clean single-line format the student can continue from.
- If the step is conceptual (no explicit equation), infer the minimal updated state consistent with the intent.
- Prefer standard math notation for the topic (${safeTopic}). For word problems, the updatedState can be a model equation or a key intermediate quantity.

Return EXACTLY this JSON shape:
{
  "updatedState": "string"
}

Original problem:
${problem}

Topic:
${safeTopic}

Current state (may be empty; if empty, start from the original problem statement):
${currentState || '(empty)'}

Previous steps:
${steps.length ? steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '(none)'}

Correct student step to apply:
${currentStep}
`.trim();
}

