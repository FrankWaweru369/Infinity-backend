import PageVisit from "../models/PageVisit.js";
import UserActivity from "../models/UserActivity.js";

export const analyticsMiddleware = async (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", async () => {
    try {
      const duration = Math.floor((Date.now() - startTime) / 1000);

      const user = req.user ? req.user._id : null;
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const page = req.originalUrl;
      const userAgent = req.headers["user-agent"] || "Unknown";

      // -----------------------------
      // 1. Save a PageVisit record
      // -----------------------------
      await PageVisit.create({
        user,
        ip,
        page,
        duration,
        userAgent
      });

      // -----------------------------
      // 2. Update UserActivity summary
      // -----------------------------
      if (user) {
        const activity = await UserActivity.findOne({ user });

        if (activity) {
          // Update existing activity
          activity.numberOfVisits += 1;
          activity.totalTimeSpent += duration;
          activity.lastVisit = new Date();
          activity.lastVisitDuration = duration;
          activity.lastVisitedPage = page;

          // Add device if new
          if (!activity.devices.includes(userAgent)) {
            activity.devices.push(userAgent);
          }

          // Track page counts
          const findPage = activity.pagesVisited.find(p => p.page === page);
          if (findPage) {
            findPage.count += 1;
          } else {
            activity.pagesVisited.push({ page, count: 1 });
          }

          await activity.save();

        } else {
          // Create new activity entry for user
          await UserActivity.create({
            user,
            numberOfVisits: 1,
            totalTimeSpent: duration,
            lastVisit: new Date(),
            lastVisitDuration: duration,
            lastVisitedPage: page,
            devices: [userAgent],
            pagesVisited: [{ page, count: 1 }]
          });
        }
      }
    } catch (err) {
      console.log("Analytics middleware error:", err.message);
    }
  });

  next();
};
