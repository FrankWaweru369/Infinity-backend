import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";

const router = express.Router();

// Use Cloudinary storage instead of local storage
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image or video
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// POST /api/upload
router.post("/", upload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const imageUrls = req.files.map(file => file.path);

    res.json({
      success: true,
      imageUrls,
      message: "Files uploaded successfully to cloud storage"
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message
    });
  }
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 35MB" });
    }
  }
  res.status(400).json({ error: error.message });
});

export default router;
