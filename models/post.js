import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true, maxlength: 500 },
    image: { type: String },
    voiceUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        
        // NEW: Comment likes
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        likeCount: { type: Number, default: 0 },
        
        // NEW: For recomments (nested comments)
        parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
        recomments: [
          {
            _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            text: { type: String, required: true },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            likeCount: { type: Number, default: 0 },
            createdAt: { type: Date, default: Date.now },
          }
        ],
        recommentCount: { type: Number, default: 0 },
        
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Update likeCount before saving comment
postSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.comments.forEach(comment => {
      comment.likeCount = comment.likes?.length || 0;
      comment.recommentCount = comment.recomments?.length || 0;
      
      // Also update recomment like counts
      if (comment.recomments) {
        comment.recomments.forEach(recomment => {
          recomment.likeCount = recomment.likes?.length || 0;
        });
      }
    });
  }
  next();
});

const Post = mongoose.model("Post", postSchema);
export default Post;
