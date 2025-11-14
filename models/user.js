import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    avatar: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "" },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    fullName: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dob: { type: Date },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // only hash if changed
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔑 Compare entered password with hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Export model
const User = mongoose.model('User', userSchema);
export default User;
