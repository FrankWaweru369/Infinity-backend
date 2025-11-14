import Post from "../models/post.js";
import User from "../models/user.js";
import path from "path";
import fs from "fs";

// ✅ Create Post
export const createPost = async (req, res) => {
  try {
    const post = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await post.save();

    // ✅ Populate author before sending response
    await post.populate("author", "username email profilePicture");

    res.status(201).json(post);
  } catch (error) {
    console.error("❌ Create post error:", error);
    res.status(500).json({ message: "Server error creating post" });
  }
};

// ✅ Get all posts (Newest first)
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username email profilePicture")
      .populate("likes", "username profilePicture")                
      .populate("comments.user", "username email profilePicture")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// ✅ Toggle Like
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const index = post.likes.indexOf(userId);

    if (index === -1) post.likes.push(userId);
    else post.likes.splice(index, 1);

    await post.save();

        // Re-fetch populated post (safest)
    const populatedPost = await Post.findById(req.params.id)
      .populate("author", "username email profilePicture")
      .populate("likes", "username profilePicture")               
      .populate("comments.user", "username email profilePicture");

    res.json(populatedPost);
  } catch (err) {
    console.error("❌ Error liking post:", err);
    res.status(500).json({ message: "Error liking post" });
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
    const { content, text } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // ✅ Handle new image
    if (req.file) {
      if (post.image) {
        const oldPath = path.join("uploads", path.basename(post.image));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      post.image = `/uploads/${req.file.filename}`;
    }

    // ✅ Update text content
    if (content || text) post.content = content || text;

    await post.save();
    await post.populate([
  { path: "author", select: "username email profilePicture" },
  { path: "comments.user", select: "username profilePicture" },
  { path: "likes", select: "username profilePicture" },
]);


    res.status(200).json({ message: "Post updated", post });
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({ error: "Server error updating post" });
  }
};

// ✅ Delete Post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author.toString() !== req.userId.toString())
      return res.status(403).json({ error: "Not authorized" });

    // ✅ Delete image file if exists
    if (post.image) {
      const filePath = path.resolve(post.image);
      fs.unlink(filePath, (err) => err && console.error("Error deleting image:", err));
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Server error deleting post" });
  }
};
