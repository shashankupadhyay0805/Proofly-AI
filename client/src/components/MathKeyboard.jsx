import { useMemo } from 'react'
import { Button } from './ui/Button.jsx'

const GROUPS = [
  {
    id: 'basic',
    label: 'Basic',
    keys: [
      { label: '±', insert: '±' },
      { label: '×', insert: '×' },
      { label: '÷', insert: '÷' },
      { label: '≈', insert: '≈' },
      { label: '≠', insert: '≠' },
      { label: '≤', insert: '≤' },
      { label: '≥', insert: '≥' },
      { label: '∞', insert: '∞' },
    ],
  },
  {
    id: 'calc',
    label: 'Calculus',
    keys: [
      { label: '∫', insert: '∫ ' },
      { label: 'd/dx', insert: 'd/dx()' },
      { label: 'dx', insert: ' dx' },
      { label: '∂', insert: '∂' },
      { label: 'lim', insert: 'lim_{x→} ' },
      { label: '→', insert: '→' },
    ],
  },
  {
    id: 'greek',
    label: 'Greek',
    keys: [
      { label: 'θ', insert: 'θ' },
      { label: 'π', insert: 'π' },
      { label: 'λ', insert: 'λ' },
      { label: 'μ', insert: 'μ' },
      { label: 'σ', insert: 'σ' },
    ],
  },
  {
    id: 'func',
    label: 'Functions',
    keys: [
      { label: '√', insert: '√()' },
      { label: 'log', insert: 'log()' },
      { label: 'ln', insert: 'ln()' },
      { label: 'sin', insert: 'sin()' },
      { label: 'cos', insert: 'cos()' },
      { label: 'tan', insert: 'tan()' },
      { label: '^', insert: '^' },
      { label: '()', insert: '()' },
      { label: 'fraction', insert: '()/()' },
    ],
  },
]

function insertAtCursor(textarea, insert) {
  if (!textarea) return
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? textarea.value.length
  const next = textarea.value.slice(0, start) + insert + textarea.value.slice(end)
  textarea.value = next

  // Place cursor inside () when inserting templates like "sin()"
  const caretOffset = insert.endsWith('()') ? insert.length - 1 : insert.length
  const caret = start + caretOffset
  textarea.setSelectionRange(caret, caret)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.focus()
}

export function MathKeyboard({ textareaRef, disabled = false }) {
  const groups = useMemo(() => GROUPS, [])

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/50">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Math keyboard
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Tap to insert symbols
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        {groups.map((g) => (
          <div key={g.id}>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {g.label}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.keys.map((k) => (
                <Button
                  key={k.label}
                  variant="secondary"
                  disabled={disabled}
                  className="px-3 py-1.5 text-xs dark:border-slate-800/70 dark:bg-slate-950/50 dark:text-slate-100"
                  onClick={() => insertAtCursor(textareaRef?.current, k.insert)}
                >
                  {k.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

