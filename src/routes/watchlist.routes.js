import express from 'express';
import { getWatchlist, addStock, removeStock } from '../controllers/watchlist.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply 'protect' middleware to all watchlist routes
router.use(protect);

router.get('/', getWatchlist);
router.post('/', addStock);
router.delete('/:symbol', removeStock);

export default router;
