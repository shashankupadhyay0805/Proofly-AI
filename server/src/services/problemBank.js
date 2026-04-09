const BANK = {
  algebra: {
    easy: [
      'Solve for x: 2x + 3 = 11',
      'Solve for x: x/3 + 4 = 10',
      'Simplify: 3(a + 2) - 2a',
    ],
    medium: [
      'Solve for x: 3x - 5 = 2x + 7',
      'Solve for x: 2(x - 3) = 14',
      'Simplify: (2x - 3)(x + 4)',
    ],
    hard: [
      'Solve for x: (x - 2)/3 + (x + 1)/2 = 7',
      'Solve for x: 5 - 2(3x - 4) = x + 9',
      'Simplify: (x^2 - 9)/(x - 3)',
    ],
  },
  differentiation: {
    easy: [
      'Differentiate with respect to x: f(x) = 3x^2',
      'Differentiate with respect to x: f(x) = 5x - 7',
      'Differentiate with respect to x: f(x) = (x^2 + 1)',
    ],
    medium: [
      'Differentiate with respect to x: f(x) = (2x - 3)(x + 4)',
      'Differentiate with respect to x: f(x) = (x^3 - 2x) / x',
      'Differentiate with respect to x: f(x) = sin(x) + x^2',
    ],
    hard: [
      'Differentiate with respect to x: f(x) = (x^2 + 1)/(x - 1)',
      'Differentiate with respect to x: f(x) = ln(x^2 + 3x)',
      'Differentiate with respect to x: f(x) = e^(2x) * cos(x)',
    ],
  },
  integration: {
    easy: [
      'Integrate with respect to x: ∫ 6x dx',
      'Integrate with respect to x: ∫ (4) dx',
      'Integrate with respect to x: ∫ (2x + 1) dx',
    ],
    medium: [
      'Integrate with respect to x: ∫ (3x^2 - 4x) dx',
      'Integrate with respect to x: ∫ cos(x) dx',
      'Integrate with respect to x: ∫ (1/x) dx',
    ],
    hard: [
      'Integrate with respect to x: ∫ (2x)/(x^2 + 1) dx',
      'Integrate with respect to x: ∫ e^(3x) dx',
      'Integrate with respect to x: ∫ (x * sin(x)) dx',
    ],
  },
  word_problems: {
    easy: [
      'A notebook costs $3 and a pen costs $2. You buy 4 notebooks and 3 pens. What is the total cost?',
      'A car travels 120 km in 3 hours. What is its average speed?',
      'You have 24 candies and want to share them equally among 6 friends. How many does each friend get?',
    ],
    medium: [
      'Two numbers add up to 30. One number is 6 more than the other. Find the numbers.',
      'A rectangle has perimeter 50 cm. Its length is 5 cm more than its width. Find its dimensions.',
      'A train leaves at 2 pm traveling 60 km/h. Another leaves at 3 pm traveling 80 km/h. When does the second catch up?',
    ],
    hard: [
      'A tank is filled by two pipes. Pipe A fills it in 6 hours, Pipe B in 8 hours. How long together?',
      'A shop offers a 20% discount then adds 5% tax. If final price is $84, what was the original price before discount?',
      'A mixture contains milk and water in ratio 3:2. How much water to add to make ratio 3:4 if total is 10 L?',
    ],
  },
  miscellaneous: {
    easy: [
      'Evaluate: i^4',
      'Compute the determinant: | 1 2 ; 3 4 |',
      'Multiply matrices: [ [1,2], [0,1] ] × [ [2,0], [1,3] ]',
    ],
    medium: [
      'Solve in complex numbers: (2 + 3i)(1 - i)',
      'Find the inverse of the matrix: [ [1, 2], [3, 4] ]',
      'Compute the determinant: | 2 0 1 ; 3 1 0 ; 4 2 1 |',
    ],
    hard: [
      'Find eigenvalues of the matrix: [ [2, 1], [1, 2] ]',
      'Solve the system using matrices: x + y = 5, 2x - y = 1',
      'Simplify: (1 + i)^5',
    ],
  },
};

export const TOPICS = Object.keys(BANK);

export function getSuggestedProblem({ topic = 'algebra', difficulty = 'easy' } = {}) {
  const topicBank = BANK[topic] || BANK.algebra;
  const list = topicBank[difficulty] || topicBank.easy;
  return list[Math.floor(Math.random() * list.length)];
}

