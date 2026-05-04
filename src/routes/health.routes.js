import express from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @desc    Check API Health
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', checkHealth);

export default router;
