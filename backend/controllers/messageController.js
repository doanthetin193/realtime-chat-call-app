const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query;

    // Validate membership of current user in the conversation
    const conversation = await Conversation.findById(conversationId).select('members');
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const isMember = conversation.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const filter = { conversation: conversationId };
    if (before) {
      filter._id = { $lt: before }; // paginate bằng _id
    }

    const messages = await Message.find(filter)
      .populate("sender", "username avatarUrl")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse()); // đảo lại để newest ở cuối
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type, mediaUrl } = req.body;

    const conversation = await Conversation.findById(conversationId).select('members');
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Validate membership of current user in the conversation
    const isMember = conversation.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content,
      type: type || "text",
      mediaUrl: mediaUrl || "",
      seenBy: [req.user.id]
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMsg = await message.populate("sender", "username avatarUrl");

    res.status(201).json(populatedMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getMessages, sendMessage };
