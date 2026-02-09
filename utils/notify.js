import Notification from "../models/Notification.js";

export const notifyFollow = async (recipientId, senderId) => {
  if (recipientId.toString() === senderId.toString()) return;

  await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: "FOLLOW",
    message: "started following you 👀"
  });
};

export const notifyLike = async (postOwnerId, senderId, postId) => {
  if (postOwnerId.toString() === senderId.toString()) return;

  await Notification.create({
    recipient: postOwnerId,
    sender: senderId,
    type: "LIKE",
    post: postId,
    message: "liked your post ❤️"
  });
};

export const notifyComment = async (postOwnerId, senderId, postId) => {
  if (postOwnerId.toString() === senderId.toString()) return;

  await Notification.create({
    recipient: postOwnerId,
    sender: senderId,
    type: "COMMENT",
    post: postId,
    message: "commented on your post 💬"
  });
};
