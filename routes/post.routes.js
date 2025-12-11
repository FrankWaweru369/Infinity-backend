import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import {
  likePostComment,
  likePostRecomment,
  addPostRecomment,
} from "../controllers/comment.controller.js";
import { storage } from "../config/cloudinary.js";

const router = express.Router();

const upload = multer({ storage });

// Post routes
router.post("/", protect, upload.single("image"), createPost);
router.get("/", protect, getPosts);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.put("/:id", protect, upload.single("image"), updatePost);
router.delete("/:id", protect, deletePost);

// Nested comment routes
router.put("/:postId/comments/:commentId/like", protect, likePostComment);
router.post("/:postId/comments/:commentId/recomment", protect, addPostRecomment);
router.put("/:postId/comments/:commentId/recomments/:recommentId/like", protect, likePostRecomment);

export default router;
