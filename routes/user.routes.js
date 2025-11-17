import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUserByUsername, getAllUsers, updatePassword, updateProfile } from "../controllers/user.controller.js";
import multer from "multer";
import path from "path";
import { storage } from "../config/cloudinary.js";


const router = express.Router();


const upload = multer({ storage });

router.get("/", getAllUsers);
router.get("/:username", getUserByUsername);
router.put("/update-password", protect, updatePassword);
router.put(
  "/update-profile",
  protect,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  updateProfile
);


export default router;
