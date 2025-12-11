import express from 'express';
import Reel from '../models/Reel.js';
import protect from '../middleware/authMiddleware.js';
import multer from 'multer';
import { storage } from "../config/cloudinary.js";
import User from "../models/user.js";
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer({ storage });

// Get all reels (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reel.countDocuments();

    res.json({
      reels,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReels: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reels from followed users
router.get('/following', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followingIds = currentUser.following || [];

    if (followingIds.length === 0) {
      return res.json({
        reels: [],
        currentPage: 1,
        totalPages: 0,
        totalReels: 0,
        message: 'You are not following anyone yet'
      });
    }

    const reels = await Reel.find({ author: { $in: followingIds } })
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      reels,
      currentPage: 1,
      totalPages: 1,
      totalReels: reels.length,
      message: reels.length === 0 ? 'No reels from followed users yet' : 'Success'
    });

  } catch (error) {
    console.error('Following reels error:', error);
    res.status(500).json({ 
      message: 'Server error: ' + error.message
    });
  }
});

// Get reels by user
router.get('/user/:userId', async (req, res) => {
  try {
    const reels = await Reel.find({ author: req.params.userId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json(reels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single reel
router.get('/:id', async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Increment views
    reel.views += 1;
    await reel.save();

    res.json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new reel
router.post('/', protect, upload.single('video'), async (req, res) => {
  try {
    const { caption, music } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const reel = new Reel({
      videoUrl: req.file.path,
      caption,
      music: music || 'Original Sound',
      author: req.userId,
    });

    await reel.save();
    await reel.populate('author', 'username profilePicture');

    res.status(201).json(reel);

  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like a reel
router.put('/:id/like', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const userId = req.userId.toString();
    const alreadyLiked = reel.likes.some(likeId =>
      likeId && likeId.toString() === userId
    );

    if (alreadyLiked) {
      // Unlike
      reel.likes = reel.likes.filter(likeId =>
        likeId && likeId.toString() !== userId
      );
    } else {
      // Like
      reel.likes.push(req.userId);
    }

    await reel.save();
    

    const populatedReel = await Reel.findById(reel._id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    res.json(populatedReel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to reel
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: 'Comment too long (max 500 characters)' });
    }

    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.comments.push({
      user: req.userId,
      text: text.trim()
    });

    await reel.save();
    

    const populatedReel = await Reel.findById(reel._id)
      .populate('author', 'username profilePicture') 
      .populate('comments.user', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    res.json(populatedReel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    
    if (reel.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await Reel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share a reel
router.post('/:id/share', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    
    reel.shares += 1;
    await reel.save();


    const populatedReel = await Reel.findById(reel._id)
      .populate('author', 'username profilePicture') 
      .populate('comments.user', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    res.json(populatedReel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =============== NEW COMMENT ROUTES ===============

// Get comments for a reel
router.get('/:reelId/comments', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { includeRecomments } = req.query;

    const reel = await Reel.findById(reelId)
      .populate('comments.user', 'username profilePicture')
      .populate('comments.likes', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture')
      .populate('comments.recomments.likes', 'username profilePicture');

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Get only top-level comments (no parentCommentId)
    let comments = reel.comments.filter(comment =>
      !comment.parentCommentId || comment.parentCommentId === null
    );

    // If includeRecomments is false, remove recomments data
    if (includeRecomments !== 'true') {
      comments = comments.map(comment => ({
        ...comment.toObject(),
        recomments: undefined // Remove recomments from response
      }));
    }

    res.json(comments);
  } catch (error) {
    console.error('Get reel comments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/unlike a comment
router.post('/:reelId/comments/:commentId/like', protect, async (req, res) => {
  try {
    const { reelId, commentId } = req.params;
    const userId = req.userId;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Find the comment
    const comment = reel.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already liked
    const alreadyLiked = comment.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike: remove user from likes
      comment.likes.pull(userId);
    } else {
      // Like: add user to likes
      comment.likes.push(userId);
    }

    // Update like count
    comment.likeCount = comment.likes.length;

    await reel.save();

    // Get updated reel with populated data
    const updatedReel = await Reel.findById(reelId)
      .populate('comments.user', 'username profilePicture')
      .populate('comments.likes', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture')
      .populate('comments.recomments.likes', 'username profilePicture');

    // Return the specific comment
    const updatedComment = updatedReel.comments.id(commentId);
    res.json(updatedComment);
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a recomment (reply to comment)
router.post('/:reelId/comments/:commentId/recomment', protect, async (req, res) => {
  try {
    const { reelId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Recomment text is required' });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const parentComment = reel.comments.id(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Create recomment
    const recomment = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      text: text.trim(),
      likes: [],
      likeCount: 0,
      createdAt: new Date()
    };

    // Add to parent comment's recomments array
    parentComment.recomments.push(recomment);
    parentComment.recommentCount = parentComment.recomments.length;

    await reel.save();

    // Get updated reel with populated data
    const updatedReel = await Reel.findById(reelId)
      .populate('comments.user', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture');

    // Find and return the specific recomment
    const updatedComment = updatedReel.comments.id(commentId);
    const addedRecomment = updatedComment.recomments.id(recomment._id);

    res.status(201).json(addedRecomment);
  } catch (error) {
    console.error('Add recomment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/unlike a recomment
router.post('/:reelId/comments/:commentId/recomments/:recommentId/like', protect, async (req, res) => {
  try {
    const { reelId, commentId, recommentId } = req.params;
    const userId = req.userId;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const comment = reel.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const recomment = comment.recomments.id(recommentId);
    if (!recomment) {
      return res.status(404).json({ message: 'Recomment not found' });
    }

    // Check if user already liked
    const alreadyLiked = recomment.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      recomment.likes.pull(userId);
    } else {
      // Like
      recomment.likes.push(userId);
    }

    // Update like count
    recomment.likeCount = recomment.likes.length;

    await reel.save();

    // Get updated data
    const updatedReel = await Reel.findById(reelId)
      .populate('comments.recomments.user', 'username profilePicture')
      .populate('comments.recomments.likes', 'username profilePicture');

    const updatedComment = updatedReel.comments.id(commentId);
    const updatedRecomment = updatedComment.recomments.id(recommentId);

    res.json(updatedRecomment);
  } catch (error) {
    console.error('Like recomment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;
