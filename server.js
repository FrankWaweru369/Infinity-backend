import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import analyticsRoutes from "./routes/analytics.routes.js";
import {analyticsMiddleware} from "./middleware/analyticsMiddleware.js";

import { fileURLToPath } from "url";


import postRoutes from "./routes/post.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import followRoutes from "./routes/follow.routes.js";
import reelRoutes from "./routes/reels.routes.js";
import exploreRoutes from "./routes/explore.routes.js";
import videoOptimizerRoutes from "./routes/videoOptimizerRoutes.js";
import commentRoutes from './routes/comment.routes.js';
import notificationRoutes from "./routes/notification.routes.js";


dotenv.config();
const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(analyticsMiddleware);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Infinity backend is running successfully!",
    timestamp: new Date().toISOString(),
    database: "Connected"
  });
});


app.get("/", (req, res) => {
  res.json({
    message: "Infinity Social Media API",
    status: "Running", 
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      posts: "/api/posts",
      reels: "/api/reels"
    }
  });
});

// Routes
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", followRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/videos", videoOptimizerRoutes);
app.use('/api', commentRoutes);
app.use("/api/notifications", notificationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });


const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
	
