import express from 'express';
import Reel from '../models/Reel.js';
import protect from '../middleware/authMiddleware.js';
import multer from 'multer';
import { storage } from "../config/cloudinary.js";
import User from "../models/user.js";

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


export default router;
