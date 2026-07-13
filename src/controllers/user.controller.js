import User from '../models/user.model.js';

/**
 * Get current user preferences from MongoDB
 */
export const getPreferences = async (req, res) => {
  try {
    // requireAuth has already atomically synchronized and attached this user.
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authenticated user profile is unavailable' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        learningMode: 'pro',
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update user learning mode
 */
export const updateLearningMode = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: req.user.clerkId },
      { learningMode: 'pro' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        learningMode: 'pro',
      }
    });
  } catch (error) {
    console.error('Error updating learning mode:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
