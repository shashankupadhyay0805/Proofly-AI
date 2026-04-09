function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateArithmeticQuestion(difficulty) {
  const level = difficulty || 'easy'

  if (level === 'easy') {
    const ops = ['+', '-']
    const op = pick(ops)
    const a = randInt(1, 50)
    const b = randInt(1, 50)
    const text = `${a} ${op} ${b} = ?`
    const answer = op === '+' ? a + b : a - b
    return { text, answer }
  }

  if (level === 'medium') {
    const ops = ['+', '-', '×', '÷']
    const op = pick(ops)
    const a = randInt(2, 25)
    const b = randInt(2, 25)

    if (op === '÷') {
      const prod = a * b
      return { text: `${prod} ÷ ${a} = ?`, answer: b }
    }

    if (op === '×') return { text: `${a} × ${b} = ?`, answer: a * b }
    if (op === '+') return { text: `${a} + ${b} = ?`, answer: a + b }
    return { text: `${a} - ${b} = ?`, answer: a - b }
  }

  // hard
  const ops = ['+', '-', '×', '÷']
  const op = pick(ops)
  const a = randInt(-50, 80)
  const b = randInt(2, 30)

  if (op === '÷') {
    const divisor = b
    const quotient = randInt(-20, 20)
    const dividend = divisor * quotient
    return { text: `${dividend} ÷ ${divisor} = ?`, answer: quotient }
  }

  if (op === '×') {
    const m = randInt(-20, 20)
    return { text: `${a} × ${m} = ?`, answer: a * m }
  }
  if (op === '+') return { text: `${a} + ${b} = ?`, answer: a + b }
  return { text: `${a} - ${b} = ?`, answer: a - b }
}

export function buildQuiz({ difficulty, count }) {
  const n = Math.max(1, Math.min(50, Number(count) || 10))
  return Array.from({ length: n }).map(() => generateArithmeticQuestion(difficulty))
}

