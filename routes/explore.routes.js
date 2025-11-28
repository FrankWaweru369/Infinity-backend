import express from 'express';
import { 
  getSuggestedUsers, 
  getPopularPosts, 
  searchUsers, 
  searchPosts 
} from '../controllers/explore.controller.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/explore/users - Get suggested users (users not followed by current user)
router.get("/users", protect, getSuggestedUsers); // ✅ ADDED protect

// GET /api/explore/posts - Get popular posts (posts with most engagement)
router.get("/posts", getPopularPosts); // Can remain public

// GET /api/explore/search/users?q=query - Search users by username or name
router.get("/search/users", protect, searchUsers); // ✅ ADDED protect

// GET /api/explore/search/posts?q=query - Search posts by content
router.get("/search/posts", searchPosts); // Can remain public

export default router;
