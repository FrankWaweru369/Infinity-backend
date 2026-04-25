// jobs/randomSuggestionJob.js
import cron from "node-cron";
import User from "../models/user.js";
import { createNotification } from "../services/notificationService.js";

export const startRandomSuggestionJob = () => {
  cron.schedule("0 10 * * *", async () => {
    const users = await User.find();

    for (const user of users) {
      const randomUser = await User.findOne({
        _id: { $ne: user._id }
      });

      if (!randomUser) continue;

      await createNotification({
        recipient: user._id,
        sender: randomUser._id,
        type: "SUGGESTION"
      });
    }
  });
};
