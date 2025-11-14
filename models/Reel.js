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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
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
  }
}, {
  timestamps: true
});

// Add index for better performance
reelSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Reel', reelSchema);
