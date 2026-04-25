// jobs/inactiveReminderJob.js
import cron from "node-cron";
import User from "../models/user.js";
import Notification from "../models/Notification.js";

export const startInactiveReminderJob = () => {
  cron.schedule("0 9 * * *", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const inactiveUsers = await User.find({
      lastActiveAt: { $lte: threeDaysAgo }
    });

    for (const user of inactiveUsers) {
      const exists = await Notification.findOne({
        recipient: user._id,
        type: "INACTIVE_POST",
        isRead: false
      });

      if (!exists) {
        await Notification.create({
          recipient: user._id,
          type: "INACTIVE_POST",
          isRead: false
        });
      }
    }
  });
};
