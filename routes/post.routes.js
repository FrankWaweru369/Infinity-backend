import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import {createPost, getPosts, toggleLike, addComment, updatePost, deletePost,} from "../controllers/post.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Routes
router.post("/", protect, upload.single("image"), createPost);
router.get("/", protect, getPosts);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.put("/:id", protect, upload.single("image"), updatePost); 
router.delete("/:id", protect, deletePost);

export default router;
