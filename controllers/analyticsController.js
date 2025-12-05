import User from "../models/user.js";
import PageVisit from "../models/PageVisit.js";
import UserActivity from "../models/UserActivity.js";
import AnalyticEvent from "../models/AnalyticEvent.js";

/**
 * Total Users
 */
export const getTotalUsers = async (req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ totalUsers: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * New Users in last 7 days
 */
export const getNewUsers = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({ newUsersLast7Days: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Most Active Users
 */
export const getMostActiveUsers = async (req, res) => {
  try {
    const users = await UserActivity.find({})
      .sort({ numberOfVisits: -1 })
      .limit(10)
      .populate("user", "username profilePicture");

    res.json({ mostActiveUsers: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Most Viewed Pages
 */
export const getMostViewedPages = async (req, res) => {
  try {
    const pages = await PageVisit.aggregate([
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ mostViewedPages: pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Average Session Duration
 */
export const getAverageSessionDuration = async (req, res) => {
  try {
    const result = await PageVisit.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
    ]);

    res.json({
      averageSessionDuration: result[0]?.avgDuration || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Most Used Devices
 */
export const getMostUsedDevices = async (req, res) => {
  try {
    const devices = await UserActivity.aggregate([
      { $unwind: "$devices" },
      { $group: { _id: "$devices", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ mostUsedDevices: devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Recently Active Users (last 24 hrs)
 */
export const getRecentActiveUsers = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24*60*60*1000);
    
    const users = await UserActivity.find({
      lastVisit: { $gte: oneDayAgo }
    }).populate("user", "username profilePicture");

    res.json({ recentActiveUsers: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Full Dashboard Summary - Top 10 Users & Pages
 */
export const getFullAnalytics = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // -----------------------------
    // Top 10 Active Users by total visits
    // -----------------------------
    const mostActiveUsersAgg = await PageVisit.aggregate([
      { $match: { user: { $ne: null } } },        // Only count visits by logged users
      { $group: { _id: "$user", totalVisits: { $sum: 1 } } }, // Count visits per user
      { $sort: { totalVisits: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details
    const mostActiveUsers = await User.populate(mostActiveUsersAgg, {
      path: "_id",
      select: "username profilePicture"
    });

    // Format result for frontend
    const topUsers = mostActiveUsers.map(u => ({
      user: u._id,
      numberOfVisits: u.totalVisits
    }));

    // -----------------------------
    // Top 10 Most Viewed Pages
    // -----------------------------
    const mostViewedPages = await PageVisit.aggregate([
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // -----------------------------
    // Average Session Duration
    // -----------------------------
    const avgSessionAgg = await PageVisit.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
    ]);

    const averageSessionDuration = avgSessionAgg[0]?.avgDuration || 0;

    // Send full analytics
    res.json({
      totalUsers,
      mostActiveUsers: topUsers,
      mostViewedPages,
      averageSessionDuration
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
