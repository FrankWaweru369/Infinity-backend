import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  savePushSubscription
} from "../controllers/notification.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);

router.patch("/:id/read", authMiddleware, markNotificationRead);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
router.post("/subscribe", authMiddleware, savePushSubscription);

export default router;
