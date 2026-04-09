function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function loadJson(key, fallback = null) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  const parsed = safeParse(raw)
  return parsed ?? fallback
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function djb2Hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  // unsigned 32-bit
  return (h >>> 0).toString(16)
}

