import express from "express";
import {checkFollowStatus, followUser, unfollowUser } from "../controllers/follow.controller.js";
import  protect  from "../middleware/authMiddleware.js";

const router = express.Router();

// Check follow status
router.get("/:id/status", protect, checkFollowStatus);

// Follow someone
router.post("/:id/follow", protect, followUser);

// Unfollow someone
router.post("/:id/unfollow", protect, unfollowUser);

export default router;
