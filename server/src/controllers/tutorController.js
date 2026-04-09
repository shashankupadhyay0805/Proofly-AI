import { z } from 'zod';
import { Attempt } from '../models/Attempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AiService } from '../services/aiService.js';
import { buildStepValidationPrompt } from '../prompts/stepValidationPrompt.js';
import { buildHintPrompt } from '../prompts/hintPrompt.js';
import { buildStateUpdatePrompt } from '../prompts/stateUpdatePrompt.js';
import { buildFullSolutionPrompt } from '../prompts/fullSolutionPrompt.js';
//import { buildMistakeClassificationPrompt } from '../prompts/mistakePrompt.js';
import { computeRecommendedDifficulty } from '../services/adaptiveService.js';
import { getSuggestedProblem, TOPICS } from '../services/problemBank.js';
import { extractTextFromImageBuffer } from '../services/ocrService.js';
import { buildOcrPostProcessPrompt } from '../prompts/ocrPostProcessPrompt.js';

const ai = new AiService();

const validateStepSchema = z.object({
  sessionId: z.string().min(1),
  problem: z.string().min(1),
  topic: z.enum(['algebra', 'differentiation', 'integration', 'word_problems', 'miscellaneous']).optional(),
  previousSteps: z.array(z.string()).default([]),
  currentStep: z.string().min(1),
});

const hintSchema = z.object({
  sessionId: z.string().min(1),
  problem: z.string().min(1),
  topic: z.enum(['algebra', 'differentiation', 'integration', 'word_problems', 'miscellaneous']).optional(),
  previousSteps: z.array(z.string()).default([]),
  hintLevel: z.number().int().min(1).max(3),
});

const fullSolutionSchema = z.object({
  sessionId: z.string().min(1),
  problem: z.string().min(1),
  topic: z.enum(['algebra', 'differentiation', 'integration', 'word_problems', 'miscellaneous']).optional(),
  previousSteps: z.array(z.string()).default([]),
});

const submitAttemptSchema = z.object({
  sessionId: z.string().min(1),
  problem: z.string().min(1),
  topic: z.enum(['algebra', 'differentiation', 'integration', 'word_problems', 'miscellaneous']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  step: z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
    feedback: z.string().min(1),
    updatedState: z.string().optional(),
    hintLevelUsed: z.number().int().min(0).max(3).optional(),
    mistakeType: z
      .enum(['conceptual_error', 'arithmetic_error', 'none'])
      .optional(),
  }),
});

export const validateStep = asyncHandler(async (req, res) => {
  const parsed = validateStepSchema.parse(req.body);

  const prompt = buildStepValidationPrompt(parsed);
  // const raw = await ai.generateJson(prompt);

  // const isCorrect = Boolean(raw?.isCorrect);
  // const feedback = String(raw?.feedback || '').trim() || 'Please try again.';
  // const nextHint = String(raw?.nextHint || '').trim();

  const raw = await ai.generateJson(prompt);

  const isCorrect = Boolean(raw?.isCorrect);
  let feedback = String(raw?.feedback || '').trim();
  if (!feedback) feedback = isCorrect ? 'Nice — that step is correct.' : 'Please try again.';
  if (isCorrect && /try again/i.test(feedback)) {
    feedback = 'Nice — that step is correct. What would you do next?';
  }
  const nextHint = String(raw?.nextHint || '').trim();
  let mistakeType = String(raw?.mistakeType || 'none').trim();
  // Normalize mistake types to exactly: conceptual_error | arithmetic_error | none
  if (isCorrect) {
    mistakeType = 'none';
  } else if (mistakeType === 'arithmetic_mistake') {
    mistakeType = 'arithmetic_error';
  } else if (mistakeType === 'step_skipped') {
    mistakeType = 'conceptual_error';
  } else if (!['conceptual_error', 'arithmetic_error', 'none'].includes(mistakeType)) {
    mistakeType = 'conceptual_error';
  }

  // If correct, compute an updated state to display for the next step.
  let updatedState = '';
  if (isCorrect) {
    const attempt =
      (await Attempt.findOne({
        sessionId: parsed.sessionId,
        problem: parsed.problem,
      })) || null;

    const statePrompt = buildStateUpdatePrompt({
      problem: parsed.problem,
      previousSteps: parsed.previousSteps,
      currentStep: parsed.currentStep,
      currentState: attempt?.currentState || '',
      topic: parsed.topic,
    });
    const stateRaw = await ai.generateJson(statePrompt);
    updatedState = String(stateRaw?.updatedState || '').trim();
  }

  // let mistakeType = 'none';
  // if (!isCorrect) {
  //   const mp = buildMistakeClassificationPrompt(parsed);
  //   const mr = await ai.generateJson(mp);
  //   const mt = String(mr?.mistakeType || '').trim();
  //   if (['conceptual_error', 'arithmetic_error'].includes(mt)) {
  //     mistakeType = mt;
  //   } else {
  //     mistakeType = 'conceptual_error';
  //   }
  // }



  const attempt = await Attempt.findOne({
    sessionId: parsed.sessionId,
    problem: parsed.problem,
  });
  const outcomes = (attempt?.steps || []).map((s) => Boolean(s.isCorrect)).concat([isCorrect]);
  const recommendedDifficulty = computeRecommendedDifficulty(outcomes);

  res.json({
    isCorrect,
    feedback,
    nextHint: isCorrect ? '' : nextHint,
    mistakeType,
    recommendedDifficulty,
    updatedState,
  });
});

export const validateStepFromImage = asyncHandler(async (req, res) => {
  const sessionId = String(req.body?.sessionId || '').trim();
  const problem = String(req.body?.problem || '').trim();
  const topic = String(req.body?.topic || '').trim() || undefined;
  const previousStepsRaw = req.body?.previousSteps;
  const previousSteps = Array.isArray(previousStepsRaw) ? previousStepsRaw.map(String) : [];

  if (!sessionId || !problem) {
    const err = new Error('Missing sessionId or problem');
    err.status = 400;
    throw err;
  }
  if (!req.file?.buffer) {
    const err = new Error('Missing image file');
    err.status = 400;
    throw err;
  }

  const ocr = await extractTextFromImageBuffer(req.file.buffer);
  const rawOcrText = ocr.text;
  if (!rawOcrText) {
    const err = new Error('Could not read text from image. Try a clearer photo.');
    err.status = 400;
    throw err;
  }

  // LLM post-processing: reconstruct math expression from noisy OCR.
  const ppPrompt = buildOcrPostProcessPrompt({
    problem,
    topic,
    ocrText: rawOcrText,
  });
  const ppRaw = await ai.generateJson(ppPrompt);
  const normalizedText = String(ppRaw?.normalizedText || '').trim();
  const latex = String(ppRaw?.latex || '').trim();
  const notes = String(ppRaw?.notes || '').trim();

  const currentStep = normalizedText || rawOcrText;
  if (!currentStep) {
    const err = new Error('Could not read text from image. Try a clearer photo.');
    err.status = 400;
    throw err;
  }

  // Reuse the exact validation pipeline on extracted text.
  const parsed = validateStepSchema.parse({
    sessionId,
    problem,
    topic,
    previousSteps,
    currentStep,
  });

  const prompt = buildStepValidationPrompt(parsed);
  const raw = await ai.generateJson(prompt);

  const isCorrect = Boolean(raw?.isCorrect);
  let feedback = String(raw?.feedback || '').trim();
  if (!feedback) feedback = isCorrect ? 'Nice — that step is correct.' : 'Please try again.';
  if (isCorrect && /try again/i.test(feedback)) {
    feedback = 'Nice — that step is correct. What would you do next?';
  }
  const nextHint = String(raw?.nextHint || '').trim();
  let mistakeType = String(raw?.mistakeType || 'none').trim();
  if (isCorrect) {
    mistakeType = 'none';
  } else if (mistakeType === 'arithmetic_mistake') {
    mistakeType = 'arithmetic_error';
  } else if (mistakeType === 'step_skipped') {
    mistakeType = 'conceptual_error';
  } else if (!['conceptual_error', 'arithmetic_error', 'none'].includes(mistakeType)) {
    mistakeType = 'conceptual_error';
  }

  let updatedState = '';
  if (isCorrect) {
    const attempt =
      (await Attempt.findOne({
        sessionId: parsed.sessionId,
        problem: parsed.problem,
      })) || null;

    const statePrompt = buildStateUpdatePrompt({
      problem: parsed.problem,
      previousSteps: parsed.previousSteps,
      currentStep: parsed.currentStep,
      currentState: attempt?.currentState || '',
      topic: parsed.topic,
    });
    const stateRaw = await ai.generateJson(statePrompt);
    updatedState = String(stateRaw?.updatedState || '').trim();
  }

  const attempt = await Attempt.findOne({
    sessionId: parsed.sessionId,
    problem: parsed.problem,
  });
  const outcomes = (attempt?.steps || []).map((s) => Boolean(s.isCorrect)).concat([isCorrect]);
  const recommendedDifficulty = computeRecommendedDifficulty(outcomes);

  res.json({
    ocr: {
      rawText: rawOcrText,
      normalizedText: normalizedText || rawOcrText,
      // Backward-compat for older frontend expectations
      text: normalizedText || rawOcrText,
      latex,
      notes,
      confidence: ocr.confidence,
    },
    isCorrect,
    feedback,
    nextHint: isCorrect ? '' : nextHint,
    mistakeType,
    recommendedDifficulty,
    updatedState,
  });
});

export const generateHint = asyncHandler(async (req, res) => {
  const parsed = hintSchema.parse(req.body);
  const prompt = buildHintPrompt(parsed);
  const raw = await ai.generateJson(prompt);

  res.json({
    hintLevel: parsed.hintLevel,
    hint: String(raw?.hint || '').trim() || 'Try rewriting the equation carefully.',
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const parsed = submitAttemptSchema.parse(req.body);

  const doc =
    (await Attempt.findOne({ sessionId: parsed.sessionId, problem: parsed.problem })) ||
    new Attempt({
      sessionId: parsed.sessionId,
      problem: parsed.problem,
      difficulty: parsed.difficulty || 'easy',
      topic: parsed.topic || 'algebra',
      steps: [],
    });

  if (parsed.difficulty) doc.difficulty = parsed.difficulty;
  if (parsed.topic) doc.topic = parsed.topic;

  doc.steps.push({
    text: parsed.step.text,
    isCorrect: parsed.step.isCorrect,
    feedback: parsed.step.feedback,
    updatedState: parsed.step.updatedState || '',
    hintLevelUsed: parsed.step.hintLevelUsed ?? 0,
    mistakeType: parsed.step.mistakeType ?? (parsed.step.isCorrect ? 'none' : 'conceptual_error'),
  });

  if (parsed.step.updatedState) {
    doc.currentState = parsed.step.updatedState;
  }

  await doc.save();

  res.json({ ok: true });
});

export const getFullSolution = asyncHandler(async (req, res) => {
  const parsed = fullSolutionSchema.parse(req.body);
  const prompt = buildFullSolutionPrompt(parsed);
  const raw = await ai.generateJson(prompt);

  res.json({
    finalAnswer: String(raw?.finalAnswer || '').trim(),
    solutionSteps: Array.isArray(raw?.solutionSteps)
      ? raw.solutionSteps.map((s) => String(s).trim()).filter(Boolean)
      : [],
    notes: String(raw?.notes || '').trim(),
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const sessionId = String(req.query.sessionId || '').trim();
  if (!sessionId) {
    const err = new Error('Missing sessionId');
    err.status = 400;
    throw err;
  }

  const attempts = await Attempt.find({ sessionId }).sort({ createdAt: -1 }).lean();

  const allSteps = attempts.flatMap((a) => a.steps || []);
  const total = allSteps.length;
  const correct = allSteps.filter((s) => s.isCorrect).length;
  const accuracy = total ? correct / total : 0;

  const mistakeCounts = allSteps.reduce((acc, s) => {
    let mt = s.mistakeType || 'none';
    if (mt === 'arithmetic_mistake') mt = 'arithmetic_error';
    if (mt === 'step_skipped') mt = 'conceptual_error';
    if (!['conceptual_error', 'arithmetic_error', 'none'].includes(mt)) mt = 'none';
    acc[mt] = (acc[mt] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  const improvementTips = [];
  if ((mistakeCounts.conceptual_error || 0) > 0) {
    improvementTips.push(
      'Conceptual: Pause and name the rule you are using (e.g., quotient rule, distributive property) before applying it.',
    );
    improvementTips.push(
      'Conceptual: Add one justification line like “Because we do the same operation to both sides, the equation stays equivalent.”',
    );
  }
  if ((mistakeCounts.arithmetic_error || 0) > 0) {
    improvementTips.push(
      'Arithmetic: Slow down on signs and simplification. Re-check each combine-like-terms step.',
    );
    improvementTips.push(
      'Arithmetic: Do a quick substitution/check (plug back in) to catch small numeric slips early.',
    );
  }
  if (!improvementTips.length) {
    improvementTips.push('Keep going: you have no recorded mistakes in this session yet.');
  }

  const recommendedDifficulty = computeRecommendedDifficulty(
    allSteps.map((s) => Boolean(s.isCorrect)),
  );

  res.json({
    accuracy,
    totalSteps: total,
    correctSteps: correct,
    mistakeCounts,
    improvementTips,
    recommendedDifficulty,
    suggestedProblem: getSuggestedProblem({
      difficulty: recommendedDifficulty,
      topic: attempts?.[0]?.topic || 'algebra',
    }),
    topics: TOPICS,
  });
});

