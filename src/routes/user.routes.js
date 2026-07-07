import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getPreferences, updateLearningMode } from '../controllers/user.controller.js';

const router = express.Router();

// Apply Clerk auth middleware to all user routes
router.use(requireAuth);

router.get('/preferences', getPreferences);
router.put('/preferences/mode', updateLearningMode);

export default router;
