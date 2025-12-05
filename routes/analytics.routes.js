import express from "express";
import {
  getTotalUsers,
  getNewUsers,
  getMostActiveUsers,
  getMostViewedPages,
  getAverageSessionDuration,
  getFullAnalytics
} from "../controllers/analyticsController.js";

const router = express.Router();

// ---- BASIC ANALYTICS ----
router.get("/total-users", getTotalUsers);
router.get("/new-users", getNewUsers);
router.get("/most-active-users", getMostActiveUsers);
router.get("/most-viewed-pages", getMostViewedPages);
router.get("/average-session-duration", getAverageSessionDuration);

// ---- FULL ANALYTICS DASHBOARD ----
router.get("/summary", getFullAnalytics);

export default router;
