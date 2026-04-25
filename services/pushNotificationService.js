import webpush from "web-push";
import User from "../models/user.js";

webpush.setVapidDetails(
  "mailto:admin@infinity.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const sendPushNotification = async (recipientId, payload) => {
  try {
    const user = await User.findById(recipientId);

    if (!user?.pushSubscription) {
      console.log("No push subscription for user:", recipientId);
      return;
    }

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload)
    );

    console.log("Push sent:", payload.title);

  } catch (err) {
    console.error("Push notification failed:");
    console.error("Message:", err.message);
    console.error("Status:", err.statusCode);
    console.error("Body:", err.body);

    if (err.statusCode === 410 || err.statusCode === 404) {
      await User.findByIdAndUpdate(recipientId, {
        $unset: { pushSubscription: "" }
      });
      console.log("Removed invalid push subscription");
    }
  }
};
