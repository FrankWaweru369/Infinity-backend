import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  sendMessage,
  getConversation,
  markMessageAsSeen,
  getInbox,
  getUnreadCount,
  markMessagesSeen,
} from "../controllers/message.controller.js";

const router = express.Router();

// Send a message
router.post("/", protect, sendMessage);

router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

router.put(
  "/seen/:userId",
  protect,
  markMessagesSeen
);

// Get conversation with a user
router.get("/:userId", protect, getConversation);

// Mark message as seen
router.put("/:id/seen", protect, markMessageAsSeen);
router.get("/", protect, getInbox);


export default router;
