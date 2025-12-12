import express from "express";
import {
  // Original functions
  getTotalUsers,
  getNewUsers,
  getMostActiveUsers,
  getMostViewedPages,
  getAverageSessionDuration,
  getMostUsedDevices,
  getRecentActiveUsers,
  getFullAnalytics,
  
  // New functions for online users & activity
  getOnlineUsers,
  getUserActivitySummary,
  getUserActivityDetail,
  getDashboardOverview,
  getUserActivityDetailEnhanced
} from "../controllers/analyticsController.js";

const router = express.Router();

// ==============================
// ORIGINAL ANALYTICS ENDPOINTS
// ==============================

// ---- BASIC ANALYTICS ----
router.get("/total-users", getTotalUsers);
router.get("/new-users", getNewUsers);
router.get("/most-active-users", getMostActiveUsers);
router.get("/most-viewed-pages", getMostViewedPages);
router.get("/average-session-duration", getAverageSessionDuration);
router.get("/most-used-devices", getMostUsedDevices);
router.get("/recent-active-users", getRecentActiveUsers);

// ---- FULL ANALYTICS DASHBOARD ----
router.get("/summary", getFullAnalytics);

// ==============================
// NEW ONLINE USER ANALYTICS
// ==============================

// Real-time online users (last 5 minutes)
router.get("/online-users", getOnlineUsers);

// All users activity with pagination
router.get("/user-activity", getUserActivitySummary);

// Single user detailed activity
router.get("/user-activity/:userId", getUserActivityDetail);

// Quick dashboard overview
router.get("/dashboard-overview", getDashboardOverview);


router.get("/user-detail-enhanced/:userId", getUserActivityDetailEnhanced);

export default router;
