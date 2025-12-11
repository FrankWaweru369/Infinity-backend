import mongoose from 'mongoose';
import Reel from '../models/Reel.js';
import Post from '../models/post.js';

// Like/Unlike a comment on a Reel
export const likeReelComment = async (req, res) => {
  try {
    const { reelId, commentId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const comment = reel.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
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

    // Populate user info - FIXED: Use findOne with projection
    const populatedReel = await Reel.findOne(
      { _id: reelId, 'comments._id': commentId },
      { 'comments.$': 1 }
    )
      .populate('comments.user', 'username profilePicture')
      .populate('comments.likes', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture')
      .populate('comments.recomments.likes', 'username profilePicture');

    if (!populatedReel || populatedReel.comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found after update' });
    }

    res.json(populatedReel.comments[0]);
  } catch (error) {
    console.error('Like reel comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like/Unlike a comment on a Post - FIXED
export const likePostComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user already liked
    const alreadyLiked = comment.likes.includes(userId);

    if (alreadyLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
    }

    comment.likeCount = comment.likes.length;
    await post.save();

    // FIXED: Use findOne with projection instead
    const updatedPost = await Post.findOne(
      { _id: postId, 'comments._id': commentId },
      { 'comments.$': 1 }
    )
      .populate('comments.user', 'username profilePicture')
      .populate('comments.likes', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture');

    if (!updatedPost || updatedPost.comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found after update' });
    }

    res.json(updatedPost.comments[0]);
  } catch (error) {
    console.error('Like post comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add recomment to a Reel comment - FIXED
export const addReelRecomment = async (req, res) => {
  try {
    const { reelId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const parentComment = reel.comments.id(commentId);
    if (!parentComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Create recomment
    const recomment = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      text,
      likes: [],
      likeCount: 0,
      createdAt: new Date()
    };

    // Add recomment to parent
    parentComment.recomments.push(recomment);
    parentComment.recommentCount = parentComment.recomments.length;

    await reel.save();

    // FIXED: Better population approach
    const populatedReel = await Reel.findOne(
      { _id: reelId, 'comments._id': commentId },
      { 'comments.$': 1 }
    )
      .populate('comments.user', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture');

    if (!populatedReel || populatedReel.comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found after update' });
    }

    const updatedComment = populatedReel.comments[0];
    // Get the last recomment (the one we just added)
    const addedRecomment = updatedComment.recomments[updatedComment.recomments.length - 1];

    res.json(addedRecomment);
  } catch (error) {
    console.error('Add reel recomment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add recomment to a Post comment - FIXED
export const addPostRecomment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const parentComment = post.comments.id(commentId);
    if (!parentComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const recomment = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      text,
      likes: [],
      likeCount: 0,
      createdAt: new Date()
    };

    parentComment.recomments.push(recomment);
    parentComment.recommentCount = parentComment.recomments.length;

    await post.save();

    // FIXED: Better population approach
    const updatedPost = await Post.findOne(
      { _id: postId, 'comments._id': commentId },
      { 'comments.$': 1 }
    )
      .populate('comments.user', 'username profilePicture')
      .populate('comments.recomments.user', 'username profilePicture');

    if (!updatedPost || updatedPost.comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found after update' });
    }

    const updatedComment = updatedPost.comments[0];
    // Get the last recomment (the one we just added)
    const addedRecomment = updatedComment.recomments[updatedComment.recomments.length - 1];

    res.json(addedRecomment);
  } catch (error) {
    console.error('Add post recomment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like/Unlike a recomment on Reel - FIXED
export const likeReelRecomment = async (req, res) => {
  try {
    const { reelId, commentId, recommentId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const comment = reel.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const recomment = comment.recomments.id(recommentId);
    if (!recomment) {
      return res.status(404).json({ error: 'Recomment not found' });
    }

    const alreadyLiked = recomment.likes.includes(userId);

    if (alreadyLiked) {
      recomment.likes.pull(userId);
    } else {
      recomment.likes.push(userId);
    }

    recomment.likeCount = recomment.likes.length;
    await reel.save();

    // FIXED: Populate before returning
    const updatedReel = await Reel.findOne(
      { _id: reelId, 'comments._id': commentId },
      { 'comments.$': 1 }
    )
      .populate('comments.recomments.user', 'username profilePicture')
      .populate('comments.recomments.likes', 'username profilePicture');

    if (!updatedReel || updatedReel.comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found after update' });
    }

    const updatedComment = updatedReel.comments[0];
    const updatedRecomment = updatedComment.recomments.id(recommentId);
    
    if (!updatedRecomment) {
      // Fallback: find by string comparison
      const foundRecomment = updatedComment.recomments.find(
        rc => rc._id.toString() === recommentId
      );
      if (foundRecomment) {
        res.json(foundRecomment);
      } else {
        res.status(404).json({ error: 'Recomment not found after update' });
      }
    } else {
      res.json(updatedRecomment);
    }
  } catch (error) {
    console.error('Like reel recomment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like/Unlike a recomment on Post - FIXED
export const likePostRecomment = async (req, res) => {
  try {
    const { postId, commentId, recommentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const recomment = comment.recomments.id(recommentId);
    if (!recomment) {
      return res.status(404).json({ error: 'Recomment not found' });
    }

    const alreadyLiked = recomment.likes.includes(userId);

    if (alreadyLiked) {
      recomment.likes.pull(userId);
    } else {
      recomment.likes.push(userId);
    }

    recomment.likeCount = recomment.likes.length;
    await post.save();

    // FIXED: Populate before returning
    const updatedPost = await Post.findOne(
      { _id: postId, 'comments._id': commentId },
      { 'comments.$': 1 }
    )
      .populate('comments.recomments.user', 'username profilePicture')
      .populate('comments.recomments.likes', 'username profilePicture');

    if (!updatedPost || updatedPost.comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found after update' });
    }

    const updatedComment = updatedPost.comments[0];
    const updatedRecomment = updatedComment.recomments.id(recommentId);
    
    if (!updatedRecomment) {
      // Fallback: find by string comparison
      const foundRecomment = updatedComment.recomments.find(
        rc => rc._id.toString() === recommentId
      );
      if (foundRecomment) {
        res.json(foundRecomment);
      } else {
        res.status(404).json({ error: 'Recomment not found after update' });
      }
    } else {
      res.json(updatedRecomment);
    }
  } catch (error) {
    console.error('Like post recomment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
