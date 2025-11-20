import express from 'express';
import Reel from '../models/Reel.js';
import auth from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from "../config/cloudinary.js";


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
router.post('/', auth, upload.single('video'), async (req, res) => {
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
    
    // Populate author info
    await reel.populate('author', 'username profilePicture');

    res.status(201).json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like a reel
router.put('/:id/like', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Convert both to string for proper comparison
    const userId = req.userId.toString();
    const alreadyLiked = reel.likes.some(likeId => 
      likeId && likeId.toString() === userId
    );

    if (alreadyLiked) {
      // Unlike - remove the user ID
      reel.likes = reel.likes.filter(likeId => 
        likeId && likeId.toString() !== userId
      );
    } else {
      // Like - add the user ID
      reel.likes.push(req.userId);
    }

    await reel.save();
    
    // Populate likes for response
    await reel.populate('likes', 'username profilePicture');

    res.json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to reel
router.post('/:id/comment', auth, async (req, res) => {
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
    
    // Populate comments for response
    await reel.populate('comments.user', 'username profilePicture');

    res.json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete reel (only by author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Check if user is the author
    if (reel.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    await Reel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reel deleted successfully' });

   const videoPath = path.join(__dirname, '..', reel.videoUrl);
if (fs.existsSync(videoPath)) {
  
}

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Increment shares
router.put('/:id/share', async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.shares += 1;
    await reel.save();

    res.json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
