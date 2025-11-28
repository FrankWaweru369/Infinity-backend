import User from "../models/user.js";

// ➕ Follow a user
export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.followers.includes(currentUserId)) {
      return res.status(400).json({ error: "Already following this user" });
    }

    targetUser.followers.push(currentUserId);
    currentUser.following.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    res.json({ message: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ➖ Unfollow a user 
export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!targetUser.followers.includes(currentUserId)) {
      return res.status(400).json({ error: "You are not following this user" });
    }

    
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()  
    );
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId.toString() 
    );

    await targetUser.save();
    await currentUser.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


export const checkFollowStatus = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    res.json({ isFollowing });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
