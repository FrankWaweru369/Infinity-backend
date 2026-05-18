import crypto from "crypto";
import Post from "../models/post.js";

export const generateInviteLink = async (req, res) => {
  try {
    const { expiresInHours, viewerId } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // 🔒 Only owner can generate links
    if (
      post.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // 👤 Only personal posts
    if (post.visibility !== "personal") {
      return res.status(400).json({
        message: "Only personal posts support invite links",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() +
        (expiresInHours || 24) * 60 * 60 * 1000
    );

    post.inviteTokens.push({
      token,
      viewer: viewerId || null,
      expiresAt,
    });

    await post.save();

    const link = `${process.env.CLIENT_URL}/personal-post/${post._id}?token=${token}`;

    res.json({
      success: true,
      link,
      expiresAt,
    });

  } catch (error) {
    console.error("❌ Invite link error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
