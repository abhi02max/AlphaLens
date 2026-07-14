import express from 'express';
import { analyzeTradeSimulation, generatePersonalFinanceInsights, getProfessionalStockReport, getStockInsight } from '../controllers/ai.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/insight/:symbol', getStockInsight);
router.get('/report/:symbol', getProfessionalStockReport);
router.post('/simulate', analyzeTradeSimulation);
router.post('/personal-finance', requireAuth, generatePersonalFinanceInsights);

export default router;
