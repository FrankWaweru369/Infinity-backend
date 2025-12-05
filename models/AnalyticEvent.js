import mongoose from "mongoose";

const AnalyticEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  data: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("AnalyticEvent", AnalyticEventSchema);
