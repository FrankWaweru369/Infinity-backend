import Post from "../models/post.js";
import User from "../models/user.js";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';
import { notifyLike } from "../utils/notify.js";
import { notifyComment } from "../utils/notify.js";
import { createNotification } from "../services/notificationService.js";
import { sendPushNotification } from "../services/pushNotificationService.js";
export const createPost = async (req, res) => {
  try {
    let imageUrls = [];

    // ✅ If using multer + cloudinary OR local files
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.path || file.url || file.location);
    }

    const post = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,

      images: imageUrls.length > 0 ? imageUrls : [],
    });

    await post.save();

    await post.populate("author", "username email profilePicture");

    res.status(201).json(post);
  } catch (error) {
    console.error("❌ Create post error:", error);
    res.status(500).json({ message: "Server error creating post" });
  }
};

// ✅ Get posts (Newest first with optional limit)
export const getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const lastPostId = req.query.lastPostId; // NEW: ID of last post from previous fetch

    let query = {};
    if (lastPostId) {
      // Fetch posts created before the lastPostId
      const lastPost = await Post.findById(lastPostId);
      if (lastPost) {
        query = { createdAt: { $lt: lastPost.createdAt } };
      }
    }

    const posts = await Post.find(query)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture')
      .populate({
        path: 'comments.user',
        select: 'username profilePicture'
      })
      .populate({
        path: 'comments.likes',
        select: 'username profilePicture'
      })
      .populate({
        path: 'comments.recomments.user',
        select: 'username profilePicture'
      })
      .populate({
        path: 'comments.recomments.likes',
        select: 'username profilePicture'
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Toggle Like
export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        message: "Post not found",
        code: "POST_NOT_FOUND"
      });
    }
    
    const hasLiked = post.likes.includes(userId);
    
    
    const updateOperation = hasLiked 
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };
    
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateOperation,
      { new: true, runValidators: true }
    );
    
    if (!updatedPost) {
      return res.status(404).json({ 
        message: "Post not found after update",
        code: "POST_UPDATE_FAILED"
      });
    }
    
    
    const populatedPost = await Post.findById(updatedPost._id)
      .populate("author", "username email profilePicture")
      .populate("likes", "username profilePicture")
      .populate({
        path: "comments.user",
        select: "username email profilePicture"
      });
	 if (!hasLiked) {
  await createNotification({
    recipient: post.author,
    sender: req.user._id,
    type: "LIKE",
    post: post._id
  });

 const author = await User.findById(post.author._id || post.author);
const liker = await User.findById(req.user._id);

if (author?.pushSubscription) {
  await sendPushNotification(author._id, {
    title: "New Like ❤️",
    body: `${liker.username} liked your post`,
    url: `/post/${post._id}`
  });
} 
} 

	  if (!hasLiked) {
  await notifyLike(
    post.author,
    userId,
    post._id
  );
}
    
    res.json({
      success: true,
      message: hasLiked ? "Post unliked" : "Post liked",
      liked: !hasLiked,
      post: populatedPost,
      likesCount: populatedPost.likes.length
    });
    
  } catch (err) {
    console.error("❌ Error in toggleLike:", err);
    res.status(500).json({ 
      message: "Error updating like",
      code: "LIKE_ERROR"
    });
  }
};

// ✅ Comment (fully populated after save)
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    // Step 1: find the post first
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Step 2: push comment
post.comments.push({ user: req.user._id, text });
await post.save();
	  await createNotification({
  recipient: post.author,
  sender: req.user._id,
  type: "COMMENT",
  post: post._id
});

 const author = await User.findById(post.author._id || post.author);
const commenter = await User.findById(req.user._id);

if (author?.pushSubscription) {
  await sendPushNotification(author._id, {
    title: "New Comment 💬",
    body: `${commenter.username} commented on your post`,
    url: `/post/${post._id}`
  });
}

await notifyComment(
  post.author,
  req.user._id,
  post._id
);

    // Step 3: re-fetch the post and populate everything
    const populatedPost = await Post.findById(req.params.id)
      .populate("author", "username email profilePicture")
      .populate("likes", "username profilePicture")
      .populate("comments.user", "username email profilePicture");

    // Step 4: return the fully populated post
    res.json(populatedPost);
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// ✅ Update Post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, text, removeImages } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Ensure images array exists
    if (!post.images) post.images = [];

    // ✅ Remove selected images
    if (removeImages) {
      const imagesToRemove = Array.isArray(removeImages)
        ? removeImages
        : [removeImages];

      for (const imageUrl of imagesToRemove) {
        try {
          const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(`infinity-platform/posts/${publicId}`);
        } catch (err) {
          console.error("Cloudinary delete failed:", err.message);
        }
      }

      post.images = post.images.filter(img => !imagesToRemove.includes(img));
    }

    // ✅ Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      post.images.push(...newImages);
    }

    // ✅ Update text content
    if (content || text) {
      post.content = content || text;
    }

    await post.save();

    await post.populate([
      { path: "author", select: "username email profilePicture" },
      { path: "comments.user", select: "username profilePicture" },
      { path: "likes", select: "username profilePicture" },
    ]);

    res.status(200).json({ message: "Post updated", post });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Server error updating post" });
  }
};

// ✅ Delete Post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // ✅ Delete all post images from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const imageUrl of post.images) {
        try {
          const filename = imageUrl.split("/").pop();
          const publicId = filename.substring(0, filename.lastIndexOf("."));

          await cloudinary.uploader.destroy(`infinity-platform/posts/${publicId}`);
        } catch (cloudinaryError) {
          console.error("Cloudinary delete failed:", cloudinaryError.message);
          
        }
      }
    }

    // ✅ Delete post document
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Server error deleting post" });
  }
};

export const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username profilePicture")
      .populate("likes", "username")
      .populate("comments.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
