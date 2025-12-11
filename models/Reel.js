import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  music: {
    type: String,
    default: 'Original Sound'
  },
  duration: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    // Each comment gets a unique ID
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    
    // NEW: Comment likes
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likeCount: {
      type: Number,
      default: 0
    },
    
    // NEW: For recomments (nested comments)
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    recomments: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        required: true
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      likeCount: {
        type: Number,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    recommentCount: {
      type: Number,
      default: 0
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  videoUrls: {
    original: String,
    high: String,
    medium: String,
    low: String
  },
  isOptimized: {
    type: Boolean,
    default: false
  },
  optimizedAt: Date
}, {
  timestamps: true
});

// Middleware to update counts before saving
reelSchema.pre('save', function(next) {
  // Update comment like counts and recomment counts
  if (this.isModified('comments')) {
    this.comments.forEach(comment => {
      comment.likeCount = comment.likes?.length || 0;
      comment.recommentCount = comment.recomments?.length || 0;
      
      // Also update recomment like counts
      comment.recomments.forEach(recomment => {
        recomment.likeCount = recomment.likes?.length || 0;
      });
    });
  }
  next();
});

// Add index for better performance
reelSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Reel', reelSchema);
