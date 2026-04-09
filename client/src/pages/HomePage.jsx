import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateSessionId } from '../lib/session.js'
import { api } from '../lib/api.js'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'

const TOPICS = [
  { id: 'algebra', name: 'Algebra', desc: 'Equations, simplification, factoring' },
  { id: 'differentiation', name: 'Differentiation', desc: 'Derivatives, rules, applications' },
  { id: 'integration', name: 'Integration', desc: 'Antiderivatives, substitution, areas' },
  { id: 'word_problems', name: 'Word problems', desc: 'Translate stories into math models' },
  { id: 'miscellaneous', name: 'Miscellaneous', desc: 'Complex numbers, matrices, determinants, and more' },
]

export function HomePage() {
  const navigate = useNavigate()
  const sessionId = useMemo(() => getOrCreateSessionId(), [])

  const [problem, setProblem] = useState(
    localStorage.getItem('adaptiveTutor.problem') || 'Solve for x: 3x - 5 = 2x + 7',
  )
  const [difficulty, setDifficulty] = useState(
    localStorage.getItem('adaptiveTutor.difficulty') || 'medium',
  )
  const [topic, setTopic] = useState(localStorage.getItem('adaptiveTutor.topic') || 'algebra')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem('adaptiveTutor.problem', problem)
  }, [problem])

  useEffect(() => {
    localStorage.setItem('adaptiveTutor.difficulty', difficulty)
  }, [difficulty])

  useEffect(() => {
    localStorage.setItem('adaptiveTutor.topic', topic)
  }, [topic])

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title="Your personal math tutor"
          subtitle="Solve step-by-step. I’ll validate your reasoning, nudge you with hints, and adapt to your learning."
          right={
            <div className="text-xs text-slate-500">
              Session: <span className="font-mono">{sessionId.slice(0, 8)}…</span>
            </div>
          }
        />

        <div className="mt-4 grid gap-4 sm:mt-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-4 dark:border-slate-800/70 dark:from-indigo-950/40 dark:to-fuchsia-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Choose a topic</div>
              <div className="mt-3 grid gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    className={[
                      'rounded-xl border px-3 py-3 text-left text-sm transition',
                      topic === t.id
                        ? 'border-indigo-300 bg-white shadow-sm dark:border-indigo-500/60 dark:bg-slate-950/60'
                        : 'border-slate-200 bg-white/70 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-950/60',
                    ].join(' ')}
                    onClick={() => {
                      setTopic(t.id)
                      localStorage.setItem('adaptiveTutor.topic', t.id)
                    }}
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</div>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950/50">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Get a practice problem</div>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100 sm:w-auto"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tip: click “Suggest problem” to auto-fill one for the selected topic.
              </p>
              <div className="mt-3">
                <Button
                  className="w-full"
                  variant="dark"
                  disabled={loading}
                  onClick={async () => {
                    setError('')
                    setLoading(true)
                    try {
                      const r = await api.suggestProblem({ topic, difficulty })
                      setProblem(r.problem)
                    } catch (e) {
                      setError(e.message || 'Failed to suggest a problem.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  {loading ? 'Suggesting…' : 'Suggest problem'}
                </Button>
              </div>
              {error ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Problem</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100"
              rows={4}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g., Solve for x: 2x + 3 = 11"
            />
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button
              className="w-full sm:w-auto"
              variant="primary"
              onClick={() => {
                localStorage.setItem('adaptiveTutor.problem', problem)
                localStorage.setItem('adaptiveTutor.difficulty', difficulty)
                localStorage.setItem('adaptiveTutor.topic', topic)
                navigate('/tutor')
              }}
            >
              Start tutoring
            </Button>
            <Button className="w-full sm:w-auto" variant="dark" onClick={() => navigate('/quiz')}>
              Play math quiz
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => navigate('/dashboard')}>
              View dashboard
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">How tutoring feels</div>
        <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
          <li>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Interactive coaching</span>: you enter the next step, I respond like a tutor.
          </li>
          <li>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Progressive hints</span>: request Hint 1 → Hint 2 → Hint 3.
          </li>
          <li>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Analytics</span>: track accuracy and common mistake types.
          </li>
          <li>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Adaptive difficulty</span>: the system suggests easier/harder next problems.
          </li>
        </ul>
      </Card>
    </div>
  )
}

