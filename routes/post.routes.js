import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import {createPost, getPosts, toggleLike, addComment, updatePost, deletePost,} from "../controllers/post.controller.js";
import { storage } from "../config/cloudinary.js";

const router = express.Router();

const upload = multer({ storage });

// Routes
router.post("/", protect, upload.single("image"), createPost);
router.get("/", protect, getPosts);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.put("/:id", protect, upload.single("image"), updatePost); 
router.delete("/:id", protect, deletePost);

export default router;
