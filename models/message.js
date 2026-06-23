import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    seen: {
      type: Boolean,
      default: false,
    },


    conversationId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
