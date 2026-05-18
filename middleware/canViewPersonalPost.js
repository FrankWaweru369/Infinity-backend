import Post from "../models/post.js";

const canViewPersonalPost = async (req, res, next) => {
  try {

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // 🔗 Invite token from URL
    const token = req.query.token;

    // 💣 Destroyed
    if (post.destroyed) {
      return res.status(410).json({
        message: "Post destroyed",
      });
    }

    // 🌍 Public/private posts
    if (post.visibility !== "personal") {
      req.post = post;
      return next();
    }

    const userId = req.user._id.toString();

    // 👑 Owner
    const isOwner =
      post.author.toString() === userId;

    // 👤 Allowed viewer
    const isAllowed =
      post.allowedViewers.some(
        (id) => id.toString() === userId
      );

    // 🛡 Optional admin override
    const isAdmin =
      req.user.role === "admin";

    // ✅ Direct access allowed
    if (isOwner || isAllowed || isAdmin) {
      req.post = post;
      return next();
    }

    // 🔗 Invite link access
    if (token) {

      const invite = post.inviteTokens.find(
        (t) => t.token === token
      );

      if (
        invite &&
        !invite.used &&
        new Date(invite.expiresAt) > new Date()
      ) {

        // 🔥 Optional one-time use
        invite.used = true;

        await post.save();

        req.post = post;

        return next();
      }
    }

    // ❌ Denied
    return res.status(403).json({
      message: "Access denied",
    });

  } catch (error) {

    console.error(
      "❌ Personal access error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

export default canViewPersonalPost;
