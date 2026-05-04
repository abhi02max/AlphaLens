/**
 * Health Check Controller
 * Handles logic for /api/health
 */
export const checkHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
};
