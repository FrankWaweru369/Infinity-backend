import Notification from "../models/Notification.js";
import User from "../models/user.js";

export const createNotification = async ({
  recipient,
  sender,
  type,
  post = null
}) => {
  try {
    const senderUser = await User.findById(sender).select("username");

    let message = "";

    switch (type) {
      case "LIKE":
        message = "liked your post";
        break;
      case "COMMENT":
        message = "commented on your post";
        break;
      case "FOLLOW":
        message = "started following you";
        break;
      default:
        message = "sent you a notification";
    }

    return await Notification.create({
      recipient,
      sender,
      type,
      post,
      message,
      isRead: false
    });

  } catch (err) {
    console.error("Notification service error:", err.message);
  }
};
