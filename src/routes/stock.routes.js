import express from 'express';
import { searchStocks, getStockDetails } from '../controllers/stock.controller.js';

const router = express.Router();

// Note: Ensure /search comes before /:symbol so express doesn't treat 'search' as a ticker symbol
router.get('/search', searchStocks);
router.get('/:symbol', getStockDetails);

export default router;
