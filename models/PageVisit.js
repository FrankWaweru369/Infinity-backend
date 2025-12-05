import mongoose from "mongoose";

const pageVisitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  ip: String,
  page: String,                 // e.g. "/dashboard"
  duration: Number,             // seconds
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("PageVisit", pageVisitSchema);
