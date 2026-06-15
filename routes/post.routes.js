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
  getSinglePost,
  addPrivateFeedback,
  getPrivateFeedbacks,
  revokePersonalPostAccess,
  destroyPersonalPost,
  revokeAllInviteLinks,
  sendPrivateFeedback,
  getUserPosts,
} from "../controllers/post.controller.js";
import {
  likePostComment,
  likePostRecomment,
  addPostRecomment,
} from "../controllers/comment.controller.js";
import { storage } from "../config/cloudinary.js";
import canViewPersonalPost from "../middleware/canViewPersonalPost.js";

const router = express.Router();

const upload = multer({ storage });

// ✅ POSTS (multi-image enabled)
router.post("/", protect, upload.any(), createPost);
router.get("/", protect, getPosts);
router.get("/user/:username", protect, getUserPosts);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);

// ✅ UPDATE POST (multi-image enabled)
router.put("/:id", protect, upload.array("images", 10), updatePost);

router.delete("/:id", protect, deletePost);

// COMMENTS
router.put("/:postId/comments/:commentId/like", protect, likePostComment);
router.post("/:postId/comments/:commentId/recomment", protect, addPostRecomment);
router.put("/:postId/comments/:commentId/recomments/:recommentId/like", protect, likePostRecomment);

router.get(
  "/:id",
  protect,
  canViewPersonalPost,
  getSinglePost
);

router.post(
  "/:id/private-feedback",
  protect,
  addPrivateFeedback
);

router.get(
  "/:id/private-feedback",
  protect,
  getPrivateFeedbacks
);

router.patch(
  "/:id/revoke-access",
  protect,
  revokePersonalPostAccess
);

router.delete(
  "/:id/destroy",
  protect,
  destroyPersonalPost
);
router.delete(
  "/:id/revoke-links",
  protect,
  revokeAllInviteLinks
);

router.post(
  "/:id/feedback",
  protect,
  sendPrivateFeedback
);
export default router;
