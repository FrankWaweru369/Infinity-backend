import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.js";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("⚠️ WARNING: JWT_SECRET is not set in environment variables!");

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production environment");
  }
}

// 🔹 Helper: generate token
const generateToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  
  return jwt.sign(
    { id: userId },
    JWT_SECRET, 
    { expiresIn: "7d" }
  );
};

// 🟢 Register
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    // Create new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Decode token to get expiry for client
    const decoded = jwt.decode(token);

    res.status(201).json({
      message: "User registered successfully",
      token,
      expiresAt: decoded.exp,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      error: "Server error during registration",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// 🟢 Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Generate token
    const token = generateToken(user._id);
    
    // Decode token to get expiry
    const decoded = jwt.decode(token);

    res.json({
      message: "Login successful",
      token,
      expiresAt: decoded.exp,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name || user.username,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error during login",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// 🟢 Get current user
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: "Not authorized",
        code: "NO_USER_IN_REQUEST" 
      });
    }

    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        code: "USER_NOT_FOUND" 
      });
    }

    res.status(200).json({
      user,
      tokenInfo: {
        expiresAt: req.user.exp
      }
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ 
      message: "Server error",
      code: "SERVER_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// 🟢 Optional: Token validation endpoint
export const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        valid: false, 
        message: "No token provided" 
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ 
          valid: false, 
          message: "User no longer exists" 
        });
      }

      return res.json({
        valid: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        expiresAt: decoded.exp,
        expiresIn: Math.max(0, decoded.exp - Math.floor(Date.now() / 1000))
      });
    } catch (verifyError) {
      console.error("Token validation error:", verifyError.name);
      
      if (verifyError.name === "TokenExpiredError") {
        return res.status(401).json({ 
          valid: false, 
          message: "Token expired",
          code: "TOKEN_EXPIRED",
          expiredAt: verifyError.expiredAt
        });
      }
      
      if (verifyError.name === "JsonWebTokenError") {
        return res.status(401).json({ 
          valid: false, 
          message: "Invalid token",
          code: "TOKEN_INVALID"
        });
      }
      
      throw verifyError;
    }
  } catch (error) {
    console.error("Validate token endpoint error:", error);
    res.status(500).json({ 
      valid: false, 
      message: "Token validation failed" 
    });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token + expiry (15 mins)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Reset URL
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Infinity Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
             <p>This link is valid for 15 minutes.</p>`
    });

    res.json({ message: "Reset link sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending reset link" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resetting password" });
  }
};
