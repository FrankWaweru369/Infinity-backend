import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  sendMessage,
  getConversation,
  markMessageAsSeen,
  getInbox,
} from "../controllers/message.controller.js";

const router = express.Router();

// Send a message
router.post("/", protect, sendMessage);

// Get conversation with a user
router.get("/:userId", protect, getConversation);

// Mark message as seen
router.put("/:id/seen", protect, markMessageAsSeen);
router.get("/", protect, getInbox);

export default router;
