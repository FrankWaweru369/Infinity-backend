import mongoose from "mongoose";

const privateFeedbackSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    images: [{ type: String }],

    voiceUrl: {
      type: String,
    },

    /*
      🌍 public
      🔒 private
      👤 personal
    */
    visibility: {
      type: String,
      enum: ["public", "private", "personal"],
      default: "public",
    },

    // 🎛 interaction controls
    allowLikes: {
      type: Boolean,
      default: true,
    },

    allowComments: {
      type: Boolean,
      default: true,
    },

    allowRecomments: {
      type: Boolean,
      default: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },

        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        text: {
          type: String,
          required: true,
        },

        // ❤️ Comment likes
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],

        likeCount: {
          type: Number,
          default: 0,
        },

        // 🔁 Recomments
        parentCommentId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
        },

        recomments: [
          {
            _id: {
              type: mongoose.Schema.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },

            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },

            text: {
              type: String,
              required: true,
            },

            likes: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
              },
            ],

            likeCount: {
              type: Number,
              default: 0,
            },

            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],


        recommentCount: {
          type: Number,
          default: 0,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

              privateFeedback: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    text: {
      type: String,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],
    // 🔒 Private feedbacks
    privateFeedbacks: [privateFeedbackSchema],

    // 👤 Allowed viewers for personal posts
    allowedViewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 💣 Auto destruction
    autoDestructAt: {
      type: Date,
      default: null,
    },

    // 🗑 Destruction state
    destroyed: {
      type: Boolean,
      default: false,
    },
	  inviteTokens: [
  {
    token: String,
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expiresAt: Date,
    used: {
      type: Boolean,
      default: false,
    },
  },
],
  },
  { timestamps: true }
);

// 🔄 Update counts before save
postSchema.pre("save", function (next) {
  if (this.isModified("comments")) {
    this.comments.forEach((comment) => {
      comment.likeCount = comment.likes?.length || 0;
      comment.recommentCount = comment.recomments?.length || 0;

      if (comment.recomments) {
        comment.recomments.forEach((recomment) => {
          recomment.likeCount = recomment.likes?.length || 0;
        });
      }
    });
  }

  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
