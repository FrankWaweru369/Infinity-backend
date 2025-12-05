import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // First, check if token exists and has basic JWT structure
      if (!token || token === "null" || token === "undefined") {
        console.error("Token is null or undefined");
        return res.status(401).json({ 
          message: "Not authorized, no valid token",
          code: "NO_TOKEN" 
        });
      }

      // Validate JWT structure (should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("Malformed token structure. Parts:", tokenParts.length);
        console.error("Token preview:", token.substring(0, 50) + "...");
        return res.status(401).json({ 
          message: "Not authorized, invalid token format",
          code: "TOKEN_MALFORMED"
        });
      }

      try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
          console.error("Token expired. Expiry:", new Date(decoded.exp * 1000));
          return res.status(401).json({ 
            message: "Session expired. Please login again.",
            code: "TOKEN_EXPIRED",
            expiredAt: decoded.exp
          });
        }

        // Find user in database
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
          console.error("User not found in database for ID:", decoded.id);
          return res.status(404).json({ 
            message: "User not found",
            code: "USER_NOT_FOUND"
          });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        req.token = token; // Store the token for potential use

        next();
      } catch (verifyError) {
        // Handle specific JWT errors
        console.error("JWT Verification Error:", verifyError.name, "-", verifyError.message);
        
        if (verifyError.name === "TokenExpiredError") {
          return res.status(401).json({ 
            message: "Session expired. Please login again.",
            code: "TOKEN_EXPIRED",
            expiredAt: verifyError.expiredAt
          });
        }
        
        if (verifyError.name === "JsonWebTokenError") {
          return res.status(401).json({ 
            message: "Invalid session. Please login again.",
            code: "TOKEN_INVALID"
          });
        }
        
        // For any other verification errors
        return res.status(401).json({ 
          message: "Not authorized, token verification failed",
          code: "TOKEN_VERIFICATION_FAILED",
          error: verifyError.message
        });
      }

    } catch (error) {
      // Catch any other unexpected errors
      console.error("Unexpected auth error:", error.message);
      console.error("Error stack:", error.stack);
      return res.status(500).json({ 
        message: "Authentication error",
        code: "AUTH_ERROR",
        error: error.message
      });
    }
  } else {
    console.warn("No Bearer token in authorization header");
    return res.status(401).json({ 
      message: "Not authorized, no token provided",
      code: "NO_AUTH_HEADER"
    });
  }
};

export default protect;
