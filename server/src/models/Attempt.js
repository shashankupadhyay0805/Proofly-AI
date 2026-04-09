import mongoose from 'mongoose';

const StepSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    feedback: { type: String, required: true },
    updatedState: { type: String, default: '' },
    hintLevelUsed: { type: Number, default: 0 },
    mistakeType: {
      type: String,
      enum: ['conceptual_error', 'arithmetic_error', 'none'],
      default: 'none',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const AttemptSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    problem: { type: String, required: true },
    currentState: { type: String, default: '' },
    topic: {
      type: String,
      enum: ['algebra', 'differentiation', 'integration', 'word_problems', 'miscellaneous'],
      default: 'algebra',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    steps: { type: [StepSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

AttemptSchema.index({ createdAt: -1 });

export const Attempt = mongoose.model('Attempt', AttemptSchema);

