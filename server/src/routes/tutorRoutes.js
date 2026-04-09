import express from 'express';
import {
  validateStep,
  validateStepFromImage,
  generateHint,
  submitAttempt,
  getAnalytics,
  getFullSolution,
} from '../controllers/tutorController.js';
import { suggestProblem } from '../controllers/problemController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });

router.post('/validate-step', validateStep);
router.post('/validate-step-image', upload.single('image'), validateStepFromImage);
router.post('/generate-hint', generateHint);
router.post('/submit-attempt', submitAttempt);
router.post('/full-solution', getFullSolution);
router.get('/suggest-problem', suggestProblem);
router.get('/analytics', getAnalytics);

export default router;

