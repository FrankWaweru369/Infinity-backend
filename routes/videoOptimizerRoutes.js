import express from "express";
import {
  optimizeVideo,
  getOptimizedVideo
} from "../controllers/videoOptimizerController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/videos/optimize - Generate Cloudinary optimized URLs
router.post("/optimize", protect, optimizeVideo);

// GET /api/videos/optimized/:reelId - Get optimized video URL (no auth needed)
router.get("/optimized/:reelId", getOptimizedVideo);


export default router;
