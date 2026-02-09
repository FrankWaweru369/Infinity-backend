import express from "express";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.patch("/:id/read", authMiddleware, markNotificationRead);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);

export default router;
