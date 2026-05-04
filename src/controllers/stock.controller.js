import * as stockService from '../services/stock.service.js';

/**
 * @desc    Search for stocks by name or ticker
 * @route   GET /api/stocks/search?q=XYZ
 * @access  Public
 */
export const searchStocks = async (req, res, next) => {
  try {
    const query = req.query.q;
    
    // Validation
    if (!query) {
      res.status(400);
      throw new Error('Please provide a search query using the ?q= parameter');
    }

    // Call Service
    const stocks = await stockService.searchStocks(query);

    // Return response
    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    next(error); // Pass to global error middleware
  }
};

/**
 * @desc    Get detailed data for a specific stock
 * @route   GET /api/stocks/:symbol
 * @access  Public
 */
export const getStockDetails = async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Call Service
    const stockDetails = await stockService.getStockDetails(symbol);

    res.status(200).json({
      success: true,
      data: stockDetails,
    });
  } catch (error) {
    // Handling Yahoo API error (e.g., invalid ticker)
    if (error.message.includes('No quote found') || error.message.includes('Failed to fetch')) {
      res.status(404);
      error.message = 'Stock not found. Please check the symbol.';
    }
    next(error); 
  }
};
