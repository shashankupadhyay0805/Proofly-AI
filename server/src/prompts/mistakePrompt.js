export function buildMistakeClassificationPrompt({
  problem,
  previousSteps,
  currentStep,
}) {
  const steps = Array.isArray(previousSteps) ? previousSteps : [];

  return `
You are a math tutor diagnosing a student's mistake type for one step.

Classify into exactly ONE of:
- "conceptual_error"
- "arithmetic_mistake"
- "step_skipped"

Rules:
- Do NOT provide the full solution.
- Output MUST be valid JSON only (no markdown, no backticks, no extra text).

Return EXACTLY this JSON shape:
{
  "mistakeType": "conceptual_error" | "arithmetic_mistake" | "step_skipped",
  "reason": "string (short)"
}

Problem:
${problem}

Previous steps:
${steps.length ? steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '(none)'}

Student step to classify:
${currentStep}
`.trim();
}

