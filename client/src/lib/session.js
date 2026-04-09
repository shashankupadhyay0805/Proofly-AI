export function getOrCreateSessionId() {
  const key = 'adaptiveTutor.sessionId'
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const id =
    (crypto?.randomUUID?.() ||
      `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`) + ''
  localStorage.setItem(key, id)
  return id
}

