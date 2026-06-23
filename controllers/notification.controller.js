import Notification from "../models/Notification.js";
import User from "../models/user.js";

/**
 * Get notifications for the current user
 */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "username profilePicture")
      .populate("post", "_id content image")
      .sort({ createdAt: -1 })
      .limit(30);


    const safeNotifications = notifications.map((n) => ({
      ...n.toObject(),
      post: n.post || null,
      sender: n.sender || {
        _id: "unknown",
        username: "Unknown User",
        profilePicture: "",
      },
    }));


    res.json({
      notifications: safeNotifications,
    });


  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


/**
 * Get unread notifications count (red badge)
 */
export const getUnreadCount = async (req, res) => {
  try {

    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });


    res.json({
      count,
    });


  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};


/**
 * Mark single notification as read
 */
export const markNotificationRead = async (req, res) => {
  try {

    const notificationId = req.params.id;


    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: req.user._id,
        },
        {
          isRead: true,
        },
        {
          new: true,
        }
      );


    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }


    res.json(notification);


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });

  }
};


/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (req, res) => {
  try {

    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );


    res.json({
      message: "All notifications marked as read",
    });


  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });

  }
};


/**
 * Save push subscription
 */
export const savePushSubscription = async (req, res) => {
  try {

    console.log("savePushSubscription called");
    console.log("User:", req.user._id);
    console.log(
      "Subscription:",
      req.body.subscription
    );


    await User.findByIdAndUpdate(
      req.user._id,
      {
        pushSubscription:
          req.body.subscription,
      }
    );


    res.json({
      success: true,
    });


  } catch (err) {

    console.error(
      "savePushSubscription error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });

  }
};
