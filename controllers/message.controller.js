import Message from "../models/message.js";

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, text } = req.body;

    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ error: "Receiver and message text are required" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: "You cannot message yourself" });
    }

    // Generate conversationId
    const ids = [senderId.toString(), receiverId.toString()].sort();
const conversationId = `${ids[0]}_${ids[1]}`;

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: text.trim(),
      conversationId,
    });

    // Populate sender info (optional for UI)
    await message.populate("sender", "username profilePicture");

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// GET /api/messages/:userId
export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Generate same conversationId
    const ids = [currentUserId.toString(), otherUserId.toString()].sort();
const conversationId = `${ids[0]}_${ids[1]}`;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "username profilePicture");

    res.json(messages);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// PUT /api/messages/:id/seen
export const markMessageAsSeen = async (req, res) => {
  try {
    const messageId = req.params.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only receiver can mark as seen
    if (message.receiver.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    message.seen = true;
    await message.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Mark seen error:", error);
    res.status(500).json({ error: "Failed to update message" });
  }
};

export const getInbox = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "username profilePicture");

    // Group by conversationId
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const key = msg.conversationId;

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, msg);
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load inbox" });
  }
};
