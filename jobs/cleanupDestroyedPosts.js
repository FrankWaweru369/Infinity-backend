import Post from "../models/post.js";

const cleanupDestroyedPosts = async () => {
  try {
    const now = new Date();

    const expiredPosts = await Post.find({
      autoDestructAt: {
        $lte: now,
      },

      destroyed: false,
    });

    for (const post of expiredPosts) {

      // 💥 destroy permanently
      post.destroyed = true;

      // optional:
      // await post.deleteOne();

      await post.save();

      console.log(
        `💣 Destroyed post ${post._id}`
      );
    }

  } catch (error) {
    console.error(
      "❌ Cleanup error:",
      error
    );
  }
};

export default cleanupDestroyedPosts;
