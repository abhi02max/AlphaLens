import express from 'express';
import { getWatchlist, addStock, removeStock } from '../controllers/watchlist.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply 'requireAuth' middleware to all watchlist routes
router.use(requireAuth);

router.get('/', getWatchlist);
router.post('/', addStock);
router.delete('/:symbol', removeStock);

export default router;
