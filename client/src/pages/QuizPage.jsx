import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { buildQuiz } from '../lib/quiz.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function QuizPage() {
  const [stage, setStage] = useState('setup') // setup | running | done

  const [difficulty, setDifficulty] = useState(
    localStorage.getItem('adaptiveTutor.quiz.difficulty') || 'easy',
  )
  const [count, setCount] = useState(
    Number(localStorage.getItem('adaptiveTutor.quiz.count') || 10),
  )
  const [minutes, setMinutes] = useState(
    Number(localStorage.getItem('adaptiveTutor.quiz.minutes') || 2),
  )

  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    localStorage.setItem('adaptiveTutor.quiz.difficulty', difficulty)
  }, [difficulty])
  useEffect(() => {
    localStorage.setItem('adaptiveTutor.quiz.count', String(count))
  }, [count])
  useEffect(() => {
    localStorage.setItem('adaptiveTutor.quiz.minutes', String(minutes))
  }, [minutes])

  const totalSeconds = useMemo(() => clamp(Number(minutes) * 60, 30, 60 * 30), [minutes])

  useEffect(() => {
    if (stage !== 'running') return
    if (timeLeft <= 0) {
      setStage('done')
      return
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [stage, timeLeft])

  const current = questions[idx]

  function start() {
    const q = buildQuiz({ difficulty, count })
    setQuestions(q)
    setIdx(0)
    setAnswer('')
    setCorrectCount(0)
    setAttempted(0)
    setFeedback('')
    setTimeLeft(totalSeconds)
    setStage('running')
  }

  function submit() {
    if (!current) return
    const raw = answer.trim()
    if (!raw) return

    const n = Number(raw)
    const isNum = Number.isFinite(n)
    const isCorrect = isNum && n === current.answer

    setAttempted((a) => a + 1)
    if (isCorrect) setCorrectCount((c) => c + 1)

    setFeedback(isCorrect ? 'Correct — nice!' : `Not quite. Correct answer: ${current.answer}`)

    // Move forward
    const next = idx + 1
    setAnswer('')
    if (next >= questions.length) {
      setStage('done')
    } else {
      setIdx(next)
    }
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title="Math quiz (Arithmetic)"
          subtitle="Train speed + accuracy with timed practice."
          right={
            stage === 'running' ? (
              <div className="flex items-center gap-2">
                <Badge tone="indigo">
                  Time: {mm}:{ss}
                </Badge>
                <Badge tone="slate">
                  Q {Math.min(idx + 1, questions.length)}/{questions.length || 0}
                </Badge>
              </div>
            ) : null
          }
        />

        {stage === 'setup' ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Difficulty
              </label>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Easy: add/subtract • Medium: includes ×/÷ • Hard: includes negatives
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Number of questions
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100"
                value={count}
                onChange={(e) => setCount(clamp(Number(e.target.value || 10), 1, 50))}
              />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">1–50</div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Time duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100"
                value={minutes}
                onChange={(e) => setMinutes(clamp(Number(e.target.value || 2), 1, 30))}
              />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">1–30</div>
            </div>

            <div className="md:col-span-3 flex flex-wrap gap-3">
              <Button variant="primary" onClick={start}>
                Start quiz
              </Button>
            </div>
          </div>
        ) : null}

        {stage === 'running' ? (
          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 text-center text-2xl font-semibold text-slate-900 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100">
              {current?.text}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Your answer
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit()
                  }}
                  placeholder="Type a number and press Enter"
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="dark" className="w-full" onClick={submit}>
                  Submit
                </Button>
              </div>
            </div>

            {feedback ? (
              <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-200">
                {feedback}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Badge tone="green">Correct: {correctCount}</Badge>
              <Badge tone="slate">Attempted: {attempted}</Badge>
            </div>
          </div>
        ) : null}

        {stage === 'done' ? (
          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 dark:border-slate-800/70 dark:bg-slate-950/40">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Results
              </div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                Score: <span className="font-semibold">{correctCount}</span> / {questions.length}
              </div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                Accuracy:{' '}
                <span className="font-semibold">
                  {questions.length ? Math.round((correctCount / questions.length) * 100) : 0}%
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                Difficulty: <span className="font-semibold">{difficulty}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setStage('setup')}>
                New quiz
              </Button>
              <Button variant="secondary" onClick={start}>
                Retry same settings
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

