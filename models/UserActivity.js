import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  numberOfVisits: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 }, // seconds
  lastVisit: { type: Date, default: null },
  lastVisitDuration: { type: Number, default: 0 },
  lastVisitedPage: { type: String, default: "" },

  devices: [{ type: String }],   // user agents
  pagesVisited: [{
    page: String,
    count: Number
  }]
});

export default mongoose.model("UserActivity", userActivitySchema);
