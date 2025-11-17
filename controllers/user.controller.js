import bcrypt from "bcryptjs";
import User from "../models/user.js";
import path from "path";
import fs from "fs";


export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("-password") // hide password
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // hide password
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};


export const updatePassword = async (req, res) => {
  try {
    const userId = req.userId; // From protect middleware
    const { currentPassword, newPassword } = req.body;

    // 1) Validate fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2) Get user
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3) Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is wrong" });
    }

    // 4) Hash and update
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.passwordChangedAt = new Date();

    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      fullName,
      username,
      bio,
      gender,
      dob,
      location,
      website,
      phone,
    } = req.body;

    // Find current user to get old images
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if username is taken by another user
    if (username && username !== user.username) {
      const exist = await User.findOne({ username });
      if (exist && exist._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updateData = {
      ...(fullName && { fullName }),
      ...(username && { username }),
      ...(bio && { bio }),
      ...(gender && { gender }),
      ...(dob && { dob }),
      ...(location && { location }),
      ...(website && { website }),
      ...(phone && { phone }),
    };

    // Handle uploaded files
    if (req.files) {
      // Profile Picture
      if (req.files.profilePicture && req.files.profilePicture[0]) {
        // Delete old profile picture
        if (user.profilePicture) {
          const oldPath = path.join("uploads", path.basename(user.profilePicture));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // Save new path
        updateData.profilePicture = req.files.profilePicture[0].path;
      }

      // Cover Photo
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        // Delete old cover photo
        if (user.coverPhoto) {
          const oldPath = path.join("uploads", path.basename(user.coverPhoto));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // Save new path
        updateData.coverPhoto = req.files.coverPhoto[0].path;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
