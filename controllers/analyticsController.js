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
      { $match: { user: { $ne: null } } },
      { $group: { _id: "$user", totalVisits: { $sum: 1 } } },
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

// ============================================
// NEW FUNCTIONS FOR ONLINE USERS & ACTIVITY
// ============================================

/**
 * ONLINE USERS (last 5 minutes)
 */
export const getOnlineUsers = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineUsers = await PageVisit.aggregate([
      {
        $match: {
          createdAt: { $gte: fiveMinutesAgo },
          user: { $ne: null }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$user",
          lastSeen: { $first: "$createdAt" },
          currentPage: { $first: "$page" },
          sessionDuration: { $first: "$duration" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          userId: "$_id",
          username: "$userInfo.username",
          profilePicture: "$userInfo.profilePicture",
          lastSeen: 1,
          currentPage: 1,
          sessionDuration: 1,
          status: "online"
        }
      }
    ]);

    res.json({ onlineUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * USER ACTIVITY SUMMARY (all users with last seen)
 */
export const getUserActivitySummary = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user activities with pagination
    const activities = await UserActivity.find({})
      .sort({ lastVisit: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profilePicture email")
      .lean();

    // Format the data
    const formattedActivities = activities.map(activity => ({
      userId: activity.user?._id,
      username: activity.user?.username,
      profilePicture: activity.user?.profilePicture,
      lastSeen: activity.lastVisit,
      totalVisits: activity.numberOfVisits,
      totalTimeSpent: activity.totalTimeSpent, // in seconds
      lastVisitedPage: activity.lastVisitedPage,
      devicesUsed: activity.devices?.length || 0
    }));

    // Get total count for pagination
    const total = await UserActivity.countDocuments();

    res.json({
      userActivities: formattedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * SINGLE USER ACTIVITY DETAIL
 */
export const getUserActivityDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's recent page visits
    const recentVisits = await PageVisit.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('page duration createdAt userAgent')
      .lean();

    // Get user activity summary
    const activitySummary = await UserActivity.findOne({ user: userId })
      .populate("user", "username profilePicture email createdAt")
      .lean();

    // Get user's most visited pages
    const topPages = await PageVisit.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$page", visits: { $sum: 1 }, totalTime: { $sum: "$duration" } } },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      userInfo: activitySummary?.user,
      summary: {
        totalVisits: activitySummary?.numberOfVisits || 0,
        totalTimeSpent: activitySummary?.totalTimeSpent || 0,
        lastSeen: activitySummary?.lastVisit,
        devicesUsed: activitySummary?.devices?.length || 0
      },
      recentVisits,
      topPages,
      pagesVisited: activitySummary?.pagesVisited || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DASHBOARD OVERVIEW (simple stats)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const [totalUsers, onlineUsers, recentActivity, topPages] = await Promise.all([
      User.countDocuments(),
      // Online users (last 5 minutes)
      PageVisit.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
        user: { $ne: null }
      }),
      // Recent page visits (last 24 hours)
      PageVisit.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      // Top 5 pages
      PageVisit.aggregate([
        { $group: { _id: "$page", visits: { $sum: 1 } } },
        { $sort: { visits: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      stats: {
        totalUsers,
        onlineUsers,
        recentActivity,
        avgSessionDuration: "N/A" // Optional: add if needed
      },
      topPages,
      updatedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ENHANCED: Single User Activity Detail with Timeline & Page Analytics
 */
export const getUserActivityDetailEnhanced = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query; // Optional: last X days

    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get ALL data in parallel for performance
    const [
      user,
      recentVisits,
      pageAnalytics,
      deviceBreakdown,
      activityPattern,
      activitySummary
    ] = await Promise.all([
      // 1. User basic info
      User.findById(userId).select('username profilePicture email createdAt'),

      // 2. Timeline: Recent visits (last 50)
      PageVisit.find({
        user: userId,
        createdAt: { $gte: daysAgo }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('page duration createdAt userAgent browser deviceType')
      .lean(),

      // 3. Page Analytics: Most visited pages with time spent
      PageVisit.aggregate([
        { $match: {
          user: userId,
          createdAt: { $gte: daysAgo }
        }},
        { $group: {
          _id: "$page",
          visits: { $sum: 1 },
          totalTime: { $sum: "$duration" },
          avgTime: { $avg: "$duration" },
          lastVisit: { $max: "$createdAt" }
        }},
        { $sort: { visits: -1 } },
        { $limit: 10 }
      ]),

      // 4. Device & Browser Breakdown
      PageVisit.aggregate([
        { $match: {
          user: userId,
          createdAt: { $gte: daysAgo }
        }},
        { $group: {
          _id: {
            device: "$deviceType",
            browser: "$browser"
          },
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } }
      ]),

      // 5. Activity Pattern: Peak hours
      PageVisit.aggregate([
        { $match: {
          user: userId,
          createdAt: { $gte: daysAgo }
        }},
        { $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),

      // 6. Activity Summary (existing)
      UserActivity.findOne({ user: userId }).lean()
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format device breakdown
    const devices = deviceBreakdown.map(d => ({
      device: d._id.device || 'desktop',
      browser: d._id.browser || 'Unknown',
      count: d.count,
      percentage: Math.round((d.count / recentVisits.length) * 100) || 0
    }));

    // Format activity pattern (peak hours)
    const peakHours = activityPattern.map(p => ({
      hour: p._id,
      visits: p.count,
      timeLabel: `${p._id}:00 - ${p._id+1}:00`
    }));

    // Calculate daily average
    const daysCount = days;
    const avgDailyVisits = recentVisits.length / daysCount;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        email: user.email,
        joinDate: user.createdAt,
        memberFor: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) + ' days'
      },
      stats: {
        totalVisits: activitySummary?.numberOfVisits || 0,
        totalTimeSpent: activitySummary?.totalTimeSpent || 0,
        avgSessionDuration: activitySummary?.totalTimeSpent / activitySummary?.numberOfVisits || 0,
        lastSeen: activitySummary?.lastVisit,
        daysTracked: days,
        visitsLastNDays: recentVisits.length,
        avgDailyVisits: Math.round(avgDailyVisits * 10) / 10
      },
      timeline: recentVisits.map(visit => ({
        id: visit._id,
        time: visit.createdAt,
        page: visit.page,
        duration: visit.duration,
        device: visit.deviceType || 'desktop',
        browser: visit.browser || 'Unknown',
        timeAgo: formatTimeAgo(visit.createdAt) // Helper function needed
      })),
      pageAnalytics: pageAnalytics.map(page => ({
        page: page._id,
        visits: page.visits,
        totalTime: page.totalTime,
        avgTime: Math.round(page.avgTime || 0),
        lastVisit: page.lastVisit,
        percentage: Math.round((page.visits / recentVisits.length) * 100) || 0
      })),
      devices,
      activityPattern: {
        peakHours,
        avgDailyVisits,
        preferredDevice: devices[0]?.device || 'desktop',
        preferredBrowser: devices[0]?.browser || 'Unknown',
        mostActiveHour: peakHours[0]?.timeLabel || 'Unknown'
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add this helper function at the top of your controller
const formatTimeAgo = (date) => {
  if (!date) return 'Never';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};
