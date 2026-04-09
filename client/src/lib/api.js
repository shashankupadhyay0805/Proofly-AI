const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'http://localhost:5000'

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`
    const err = new Error(msg)
    if (typeof data?.retryAfterSeconds === 'number') {
      err.retryAfterSeconds = data.retryAfterSeconds
    }
    throw err
  }
  return data
}

export const api = {
  validateStep: (payload) => request('/api/validate-step', { method: 'POST', body: payload }),
  validateStepImage: async ({ sessionId, problem, topic, previousSteps, imageFile }) => {
    const form = new FormData()
    form.append('sessionId', sessionId)
    form.append('problem', problem)
    if (topic) form.append('topic', topic)
    // Send previousSteps as repeated fields for simple parsing.
    ;(previousSteps || []).forEach((s) => form.append('previousSteps', s))
    form.append('image', imageFile)

    const res = await fetch(`${API_BASE}/api/validate-step-image`, {
      method: 'POST',
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.error || `Request failed (${res.status})`
      const err = new Error(msg)
      if (typeof data?.retryAfterSeconds === 'number') {
        err.retryAfterSeconds = data.retryAfterSeconds
      }
      throw err
    }
    return data
  },
  generateHint: (payload) => request('/api/generate-hint', { method: 'POST', body: payload }),
  submitAttempt: (payload) => request('/api/submit-attempt', { method: 'POST', body: payload }),
  fullSolution: (payload) => request('/api/full-solution', { method: 'POST', body: payload }),
  suggestProblem: ({ topic, difficulty } = {}) => {
    const qs = new URLSearchParams()
    if (topic) qs.set('topic', topic)
    if (difficulty) qs.set('difficulty', difficulty)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/suggest-problem${suffix}`)
  },
  analytics: (sessionId) =>
    request(`/api/analytics?sessionId=${encodeURIComponent(sessionId)}`),
}

