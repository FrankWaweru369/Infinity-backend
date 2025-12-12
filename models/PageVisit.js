import mongoose from "mongoose";

const pageVisitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  ip: String,
  page: String,
  duration: Number,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

pageVisitSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("PageVisit", pageVisitSchema);
