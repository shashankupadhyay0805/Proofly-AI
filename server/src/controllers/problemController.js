import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSuggestedProblem, TOPICS } from '../services/problemBank.js';

const suggestSchema = z.object({
  topic: z.enum(['algebra', 'differentiation', 'integration', 'word_problems', 'miscellaneous']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export const suggestProblem = asyncHandler(async (req, res) => {
  const parsed = suggestSchema.parse({
    topic: req.query.topic,
    difficulty: req.query.difficulty,
  });

  const topic = parsed.topic || 'algebra';
  const difficulty = parsed.difficulty || 'easy';

  res.json({
    topic,
    difficulty,
    problem: getSuggestedProblem({ topic, difficulty }),
    topics: TOPICS,
  });
});

