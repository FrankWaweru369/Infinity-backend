import User from "../models/user.js";
import Post from "../models/post.js";

// Get suggested users (users not followed by current user)
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;

    let query = {};

    // If user is logged in, exclude users they already follow and themselves
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('following');
      
      if (currentUser) {
        // Exclude users the current user is already following
        const excludedUsers = [...currentUser.following, currentUserId];
        query._id = { $nin: excludedUsers };
      } else {
        // User not found, just exclude self
        query._id = { $ne: currentUserId };
      }
    }

    const suggestedUsers = await User.find(query)
      .select("username profilePicture followers following createdAt")
      .limit(10)
      .sort({ followers: -1, createdAt: -1 });

    // Check if current user is following each suggested user
    const usersWithFollowingStatus = await Promise.all(
      suggestedUsers.map(async (user) => {
        const isFollowing = currentUserId ? 
          user.followers.some(followerId => 
            followerId.toString() === currentUserId.toString()
          ) : false;

        return {
          // ✅ RETURN SAME STRUCTURE AS PROFILE PAGE
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          // ✅ KEEP FOLLOWERS ARRAY (not followersCount)
          followers: user.followers,
          // ✅ KEEP FOLLOWING ARRAY (not followingCount)
          following: user.following,
          isFollowing,
          createdAt: user.createdAt
        };
      })
    );

    res.json({
      success: true,
      users: usersWithFollowingStatus,
      message: "Suggested users fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching suggested users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suggested users",
      error: error.message
    });
  }
};

// Get popular posts (posts with most engagement)
export const getPopularPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username profilePicture")
      .limit(20)
      .lean();

    const sortedPosts = posts
      .map(post => ({
        ...post,
        engagementScore: (post.likes?.length || 0) + (post.comments?.length || 0)
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);

    res.json({
      success: true,
      posts: sortedPosts,
      message: "Popular posts fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching popular posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching popular posts",
      error: error.message
    });
  }
};

// Search users by username or name
export const searchUsers = async (req, res) => {
  try {
    const { q: searchQuery } = req.query;
    const currentUserId = req.userId;

    if (!searchQuery?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery.trim(), $options: "i" } },
        { name: { $regex: searchQuery.trim(), $options: "i" } }
      ]
    })
    .select("username profilePicture followers following createdAt")
    .limit(20)
    .sort({ followers: -1 });

    // Check if current user is following each searched user
    const usersWithFollowingStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = currentUserId ? 
          user.followers.some(followerId => 
            followerId.toString() === currentUserId.toString()
          ) : false;

        return {
          // ✅ RETURN SAME STRUCTURE AS PROFILE PAGE
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          // ✅ KEEP FOLLOWERS ARRAY (not followersCount)
          followers: user.followers,
          // ✅ KEEP FOLLOWING ARRAY (not followingCount)
          following: user.following,
          isFollowing,
          createdAt: user.createdAt
        };
      })
    );

    res.json({
      success: true,
      users: usersWithFollowingStatus,
      count: usersWithFollowingStatus.length,
      message: `Found ${usersWithFollowingStatus.length} users matching "${searchQuery}"`
    });

  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Error searching users",
      error: error.message
    });
  }
};

// Search posts by content (unchanged)
export const searchPosts = async (req, res) => {
  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const posts = await Post.find({
      content: { $regex: searchQuery.trim(), $options: "i" }
    })
    .populate("author", "username profilePicture")
    .limit(20)
    .sort({ createdAt: -1 })
    .lean();

    const postsWithEngagement = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0
    }));

    res.json({
      success: true,
      posts: postsWithEngagement,
      count: postsWithEngagement.length,
      message: `Found ${postsWithEngagement.length} posts matching "${searchQuery}"`
    });

  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error searching posts",
      error: error.message
    });
  }
};
