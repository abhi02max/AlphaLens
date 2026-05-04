import express from 'express';
import { getStockInsight } from '../controllers/ai.controller.js';

const router = express.Router();

router.get('/insight/:symbol', getStockInsight);

export default router;
