import express from 'express';
import { searchStocks, getStockDetails, getStockChart } from '../controllers/stock.controller.js';

const router = express.Router();

// Note: Ensure /search comes before /:symbol so express doesn't treat 'search' as a ticker symbol
router.get('/search', searchStocks);
router.get('/quote/:symbol', getStockDetails);
router.get('/chart/:symbol', getStockChart);

export default router;
