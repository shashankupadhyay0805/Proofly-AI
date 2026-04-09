import Groq from 'groq-sdk';

function extractFirstJsonObject(text) {
  if (!text) return null;
  const cleaned = String(text).trim();

  // If the model accidentally wraps JSON in fences, strip them.
  const unfenced = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Fast path: parse directly.
  try {
    return JSON.parse(unfenced);
  } catch {
    // Continue.
  }

  // Heuristic: find first {...} block.
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const candidate = unfenced.slice(start, end + 1);
    return JSON.parse(candidate);
  }
  return null;
}

function parseRetryAfterSeconds(message) {
  const msg = String(message || '');
  // Example: "Please retry in 44.3914s." or retryDelay":"44s"
  const m1 = msg.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (m1?.[1]) return Math.ceil(Number(m1[1]));
  const m2 = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  if (m2?.[1]) return Number(m2[1]);
  return null;
}

export class AiService {
  constructor() {
    const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase().trim();
    this.provider = provider;

    if (provider !== 'groq') {
      throw new Error(
        `Unsupported AI_PROVIDER "${provider}". Set AI_PROVIDER=groq in server/.env.`,
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error('Missing GROQ_API_KEY');
    }

    this.modelName = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    this.groq = new Groq({ apiKey: groqKey });
  }

  async generateJson(prompt) {
    let text = '';
    try {
      const completion = await this.groq.chat.completions.create({
        model: this.modelName,
        temperature: 0.2,
        top_p: 0.9,
        // Ask Groq to enforce JSON output when supported by the model.
        response_format: { type: 'json_object' },
        max_tokens: 1800,
        messages: [
          {
            role: 'system',
            content:
              'You are a math tutor AI. You must follow the user instructions exactly. Output only valid JSON with no extra text.',
          },
          { role: 'user', content: prompt },
        ],
      });

      text = completion?.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      const status = Number(err?.status) || Number(err?.response?.status) || 500;
      const msg = String(err?.message || err?.response?.data?.error?.message || '');

      if (status === 429 || msg.toLowerCase().includes('rate limit')) {
        const e = new Error('AI rate limit exceeded. Please retry shortly.');
        e.status = 429;
        const retryAfter = parseRetryAfterSeconds(msg) || null;
        if (retryAfter) e.retryAfterSeconds = retryAfter;
        throw e;
      }

      if (status === 401 || status === 403) {
        const e = new Error('Invalid/unauthorized GROQ_API_KEY.');
        e.status = 401;
        throw e;
      }

      throw err;
    }

    const parsed = extractFirstJsonObject(text);
    if (!parsed) {
      const err = new Error('AI returned non-JSON output');
      err.status = 502;
      throw err;
    }
    return parsed;
  }
}

