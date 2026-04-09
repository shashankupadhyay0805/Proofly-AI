export function buildOcrPostProcessPrompt({ problem, topic, ocrText }) {
  const safeTopic = topic || 'general';

  return `
You are a math tutor helping interpret OCR from a student's handwritten step.

Task:
- Clean up OCR noise and reconstruct the intended mathematical step.
- Preserve meaning. Do not invent new math.
- If the OCR is ambiguous, choose the most conservative interpretation and mention uncertainty in notes.

Output MUST be valid JSON only (no markdown, no extra text).

Return EXACTLY this JSON shape:
{
  "normalizedText": "string",
  "latex": "string",
  "notes": "string"
}

Context (problem):
${problem}

Topic:
${safeTopic}

Raw OCR text:
${ocrText}
`.trim();
}

