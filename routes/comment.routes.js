import express from 'express';
import {
  likeReelComment,
  likePostComment,
  addReelRecomment,
  addPostRecomment,
  likeReelRecomment,
  likePostRecomment
} from '../controllers/comment.controller.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Reel comment routes
router.post('/reels/:reelId/comments/:commentId/like', auth, likeReelComment);
router.post('/reels/:reelId/comments/:commentId/recomment', auth, addReelRecomment);
router.post('/reels/:reelId/comments/:commentId/recomments/:recommentId/like', auth, likeReelRecomment);

// Post comment routes
router.post('/posts/:postId/comments/:commentId/like', auth, likePostComment);
router.post('/posts/:postId/comments/:commentId/recomment', auth, addPostRecomment);
router.post('/posts/:postId/comments/:commentId/recomments/:recommentId/like', auth, likePostRecomment);

export default router;
