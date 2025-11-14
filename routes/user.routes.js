import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUserByUsername, getAllUsers, updatePassword, updateProfile } from "../controllers/user.controller.js";
import multer from "multer";
import path from "path";


const router = express.Router();


// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
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
