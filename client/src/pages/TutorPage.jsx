import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { getOrCreateSessionId } from '../lib/session.js'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { djb2Hash, loadJson, saveJson } from '../lib/persist.js'
import { MathKeyboard } from '../components/MathKeyboard.jsx'

export function TutorPage() {
  const sessionId = useMemo(() => getOrCreateSessionId(), [])
  const stepTextareaRef = useRef(null)

  const [problem, setProblem] = useState(localStorage.getItem('adaptiveTutor.problem') || '')
  const [difficulty, setDifficulty] = useState(localStorage.getItem('adaptiveTutor.difficulty') || 'easy')
  const [topic, setTopic] = useState(localStorage.getItem('adaptiveTutor.topic') || 'algebra')

  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState('')
  const [stepImageFile, setStepImageFile] = useState(null)
  const [stepImagePreviewUrl, setStepImagePreviewUrl] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [currentState, setCurrentState] = useState('')
  const [hintLevel, setHintLevel] = useState(1)
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(null)
  const [solution, setSolution] = useState(null)
  const [showSolution, setShowSolution] = useState(false)
  const [chat, setChat] = useState(() => [
    {
      role: 'tutor',
      text:
        "Hey! I’m your tutor. Let’s take this one step at a time. What’s the next step you’d try?",
    },
  ])

  const persistKey = useMemo(() => {
    const p = (problem || '').trim()
    const h = djb2Hash(p || 'empty')
    return `adaptiveTutor.tutorState.${sessionId}.${h}`
  }, [sessionId, problem])

  useEffect(() => {
    if (!problem) {
      setProblem('Solve for x: 2x + 3 = 11')
      setDifficulty('easy')
    }
  }, [problem])

  // Rehydrate on mount / when problem changes (if we have saved state).
  useEffect(() => {
    const saved = loadJson(persistKey, null)
    if (!saved) return

    if (Array.isArray(saved.steps)) setSteps(saved.steps)
    if (typeof saved.currentState === 'string') setCurrentState(saved.currentState)
    if (Array.isArray(saved.chat) && saved.chat.length) setChat(saved.chat)
    if (typeof saved.hintLevel === 'number') setHintLevel(saved.hintLevel)
    if (typeof saved.topic === 'string') setTopic(saved.topic)
    if (typeof saved.difficulty === 'string') setDifficulty(saved.difficulty)
  }, [persistKey])

  // Persist key selections so switching pages keeps them.
  useEffect(() => {
    localStorage.setItem('adaptiveTutor.problem', problem)
  }, [problem])
  useEffect(() => {
    localStorage.setItem('adaptiveTutor.difficulty', difficulty)
  }, [difficulty])
  useEffect(() => {
    localStorage.setItem('adaptiveTutor.topic', topic)
  }, [topic])

  // Persist the tutoring session so route switches don't lose it.
  useEffect(() => {
    saveJson(persistKey, {
      problem,
      difficulty,
      topic,
      steps,
      currentState,
      chat,
      hintLevel,
      updatedAt: Date.now(),
    })
  }, [persistKey, problem, difficulty, topic, steps, currentState, chat, hintLevel])

  const previousSteps = steps.map((s) => s.text)

  async function onValidate() {
    setAiError('')
    setRetryAfterSeconds(null)
    setLoading(true)
    setHint('')
    try {
      const result = stepImageFile
        ? await api.validateStepImage({
            sessionId,
            problem,
            topic,
            previousSteps,
            imageFile: stepImageFile,
          })
        : await api.validateStep({
            sessionId,
            problem,
            topic,
            previousSteps,
            currentStep,
          })

      const submittedStepText = stepImageFile
        ? (result?.ocr?.normalizedText || result?.ocr?.text || result?.ocr?.rawText || '').trim()
        : currentStep.trim()
      const stepRecord = {
        text: submittedStepText,
        isCorrect: result.isCorrect,
        feedback: result.feedback,
        mistakeType: result.mistakeType || (result.isCorrect ? 'none' : 'conceptual_error'),
        hintLevelUsed: 0,
        updatedState: result.updatedState || '',
      }

      setSteps((s) => [...s, stepRecord])
      setFeedback(result)
      setChat((c) => [
        ...c,
        { role: 'student', text: submittedStepText || '(image step)' },
        {
          role: 'tutor',
          text: result.isCorrect
            ? `${result.feedback} What would you do next?`
            : `${result.feedback} Try this: ${result.nextHint || 'Take a smaller step.'}`,
        },
      ])
      if (result.isCorrect && result.updatedState) {
        setCurrentState(result.updatedState)
      }

      if (result.recommendedDifficulty && result.recommendedDifficulty !== difficulty) {
        setDifficulty(result.recommendedDifficulty)
        localStorage.setItem('adaptiveTutor.difficulty', result.recommendedDifficulty)
      }

      await api.submitAttempt({
        sessionId,
        problem,
        topic,
        difficulty,
        step: stepRecord,
      })

      setCurrentStep('')
      setStepImageFile(null)
      if (stepImagePreviewUrl) URL.revokeObjectURL(stepImagePreviewUrl)
      setStepImagePreviewUrl('')
      setHintLevel(1)
    } catch (e) {
      setAiError(e.message || 'Something went wrong.')
      if (typeof e.retryAfterSeconds === 'number') {
        setRetryAfterSeconds(e.retryAfterSeconds)
      }
    } finally {
      setLoading(false)
    }
  }

  async function onFullSolution() {
    setAiError('')
    setRetryAfterSeconds(null)
    setLoading(true)
    try {
      const result = await api.fullSolution({
        sessionId,
        problem,
        topic,
        previousSteps,
      })
      setSolution(result)
      setShowSolution(true)
    } catch (e) {
      setAiError(e.message || 'Failed to get full solution.')
      if (typeof e.retryAfterSeconds === 'number') {
        setRetryAfterSeconds(e.retryAfterSeconds)
      }
    } finally {
      setLoading(false)
    }
  }

  async function onHint() {
    setAiError('')
    setRetryAfterSeconds(null)
    setLoading(true)
    try {
      const result = await api.generateHint({
        sessionId,
        problem,
        topic,
        previousSteps,
        hintLevel,
      })
      setHint(result.hint)
      setChat((c) => [...c, { role: 'tutor', text: result.hint }])
      setHintLevel((h) => Math.min(3, h + 1))
    } catch (e) {
      setAiError(e.message || 'Failed to get hint.')
      if (typeof e.retryAfterSeconds === 'number') {
        setRetryAfterSeconds(e.retryAfterSeconds)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Problem</div>
            <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{problem}</div>
            {currentState ? (
              <div className="mt-2 inline-flex rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                Current state: <span className="ml-1 font-mono">{currentState}</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="indigo">Difficulty: {difficulty}</Badge>
            <Badge tone="slate">Topic: {topic.replaceAll('_', ' ')}</Badge>
            <Badge tone="slate">Session: {sessionId.slice(0, 8)}…</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/50">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tutor chat</div>
              <div className="mt-3 h-72 overflow-auto rounded-xl bg-gradient-to-b from-slate-50 to-white p-3 dark:from-slate-950/60 dark:to-slate-950/20">
                <div className="grid gap-2">
                  {chat.map((m, idx) => (
                    <div
                      key={idx}
                      className={[
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                        m.role === 'tutor'
                          ? 'bg-white border border-slate-200 text-slate-800 dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-100'
                          : 'ml-auto bg-indigo-600 text-white',
                      ].join(' ')}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Your next step</label>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-100"
                  value={currentStep}
                  onChange={(e) => setCurrentStep(e.target.value)}
                  disabled={Boolean(stepImageFile)}
                  ref={stepTextareaRef}
                  placeholder={
                    topic === 'differentiation'
                      ? 'e.g., Use the power rule: d/dx(x^n)=n x^(n-1)'
                      : topic === 'integration'
                        ? 'e.g., Identify the pattern and apply ∫x^n dx'
                        : topic === 'word_problems'
                          ? 'e.g., Let x be..., then write an equation...'
                          : 'e.g., Subtract 3 from both sides: 2x = 8'
                  }
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Use the keyboard for ∫, d/dx, √, π, θ, …
                  </div>
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled={Boolean(stepImageFile)}
                    onClick={() => setShowKeyboard((v) => !v)}
                  >
                    {showKeyboard ? 'Hide keyboard' : 'Math keyboard'}
                  </Button>
                </div>
                {showKeyboard ? (
                  <div className="mt-3">
                    <MathKeyboard textareaRef={stepTextareaRef} disabled={Boolean(stepImageFile)} />
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Or upload a photo of handwritten work
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      setStepImageFile(f)
                      if (stepImagePreviewUrl) URL.revokeObjectURL(stepImagePreviewUrl)
                      setStepImagePreviewUrl(f ? URL.createObjectURL(f) : '')
                      if (f) setCurrentStep('')
                    }}
                  />
                  {stepImagePreviewUrl ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 dark:border-slate-800/70 dark:bg-slate-950/50">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Preview</div>
                      <img
                        src={stepImagePreviewUrl}
                        alt="Uploaded step"
                        className="mt-2 max-h-48 w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-950/60"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1 text-xs"
                          onClick={() => {
                            setStepImageFile(null)
                            if (stepImagePreviewUrl) URL.revokeObjectURL(stepImagePreviewUrl)
                            setStepImagePreviewUrl('')
                          }}
                        >
                          Remove image
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {feedback?.ocr?.normalizedText || feedback?.ocr?.text || feedback?.ocr?.rawText ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-xs text-slate-700 dark:border-slate-800/70 dark:bg-slate-950/50 dark:text-slate-200">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">OCR extracted</div>
                      <div className="mt-1 font-mono whitespace-pre-wrap">
                        {feedback?.ocr?.normalizedText || feedback?.ocr?.text || feedback?.ocr?.rawText}
                      </div>
                      {typeof feedback?.ocr?.confidence === 'number' ? (
                        <div className="mt-1 text-slate-500 dark:text-slate-400">
                          Confidence: {Math.round(feedback.ocr.confidence)}%
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="dark"
                    disabled={loading || (!currentStep.trim() && !stepImageFile)}
                    onClick={onValidate}
                  >
                    {loading ? 'Checking…' : 'Validate step'}
                  </Button>
                  <Button variant="secondary" disabled={loading} onClick={onHint}>
                    Get hint ({Math.min(hintLevel, 3)}/3)
                  </Button>
                  <Button
                    variant="danger"
                    disabled={loading}
                    onClick={() => {
                      const ok = window.confirm(
                        'Reveal the full solution? This will show the final answer and steps.',
                      )
                      if (ok) onFullSolution()
                    }}
                  >
                    Reveal full solution
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid gap-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Session</div>
              <div className="mt-3 grid gap-2 text-sm">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Topic</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700/70 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value)
                    localStorage.setItem('adaptiveTutor.topic', e.target.value)
                    setChat((c) => [
                      ...c,
                      {
                        role: 'tutor',
                        text: `Got it — switching to ${e.target.value.replaceAll('_', ' ')}. What’s your next step?`,
                      },
                    ])
                  }}
                >
                  <option value="algebra">Algebra</option>
                  <option value="differentiation">Differentiation</option>
                  <option value="integration">Integration</option>
                  <option value="word_problems">Word problems</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>

                <label className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Difficulty</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700/70 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value)
                    localStorage.setItem('adaptiveTutor.difficulty', e.target.value)
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {feedback ? (
              <div
                className={[
                  'rounded-2xl border p-4 text-sm shadow-sm',
                  feedback.isCorrect
                    ? 'border-green-200/70 bg-green-50/80 text-green-800'
                    : 'border-amber-200/70 bg-amber-50/80 text-amber-900',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {feedback.isCorrect ? 'Nice — that works.' : 'Close — let’s adjust.'}
                  </div>
                  {feedback.isCorrect ? (
                    <Badge tone="green">Correct</Badge>
                  ) : (
                    <Badge tone="red">Incorrect</Badge>
                  )}
                </div>
                <div className="mt-2">{feedback.feedback}</div>
                {!feedback.isCorrect && feedback.nextHint ? (
                  <div className="mt-3 rounded-xl border border-slate-200/60 bg-white/60 p-3">
                    <div className="text-xs font-semibold text-slate-700">Next hint</div>
                    <div className="mt-1 text-sm text-slate-800">{feedback.nextHint}</div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {aiError ? (
              <div className="rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-700 shadow-sm">
                <div className="font-semibold">Something went wrong</div>
                <div className="mt-1">{aiError}</div>
                {retryAfterSeconds ? (
                  <div className="mt-1 text-xs text-red-700/90">
                    Retry in about {retryAfterSeconds}s.
                  </div>
                ) : null}
              </div>
            ) : null}

            {hint ? (
              <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/80 p-4 text-sm text-indigo-900 shadow-sm">
                <div className="text-xs font-semibold text-indigo-800">Hint</div>
                <div className="mt-1">{hint}</div>
              </div>
            ) : null}

            {showSolution && solution ? (
              <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-900 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-rose-800">Full solution</div>
                  <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setShowSolution(false)}>
                    Hide
                  </Button>
                </div>
                {solution.finalAnswer ? (
                  <div className="mt-2">
                    <span className="font-semibold">Final answer:</span>{' '}
                    <span className="font-mono">{solution.finalAnswer}</span>
                  </div>
                ) : null}
                {Array.isArray(solution.solutionSteps) && solution.solutionSteps.length ? (
                  <ol className="mt-3 list-decimal space-y-1 pl-5">
                    {solution.solutionSteps.map((s, i) => (
                      <li key={i} className="text-sm text-rose-900">
                        {s}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {solution.notes ? (
                  <div className="mt-3 text-xs text-rose-800/90">{solution.notes}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Your steps</div>
          <div className="text-xs text-slate-500">
            The tutor validates each step without revealing the full solution.
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {steps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No steps yet. Enter your first step above.
            </div>
          ) : (
            steps.map((s, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Step {idx + 1}</div>
                  {s.isCorrect ? <Badge tone="green">Correct</Badge> : <Badge tone="red">Incorrect</Badge>}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{s.text}</div>
                <div className="mt-2 text-xs text-slate-500">{s.feedback}</div>
                {!s.isCorrect ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Mistake type: <span className="font-medium">{s.mistakeType.replaceAll('_', ' ')}</span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

