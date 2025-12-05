const express = require('express');
const mongoose = require('mongoose');
const Landlord = require('../models/Landlord');
const Listing = require('../models/Listing');

const router = express.Router();

// GET /api/stats - Public platform statistics
router.get('/', async (req, res) => {
  try {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalListings,
      activeListings,
      newUsersLast7Days,
      newListingsLast7Days
    ] = await Promise.all([
      Landlord.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Landlord.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Listing.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalListings,
        activeListings,
        newUsersLast7Days,
        newListingsLast7Days
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;

