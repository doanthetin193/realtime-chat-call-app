const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const createConversation = async (req, res) => {
  try {
    const { memberIds, isGroup, name } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ message: "Members required" });
    }

    // Thêm chính user vào members
    if (!memberIds.includes(req.user.id)) {
      memberIds.push(req.user.id);
    }

    // Kiểm tra nếu là chat 1-1, xem đã tồn tại conversation chưa
    if (!isGroup && memberIds.length === 2) {
      const existingConversation = await Conversation.findOne({
        isGroup: false,
        members: { $all: memberIds, $size: 2 }
      }).populate("members", "username email avatarUrl isOnline lastSeen");
      
      if (existingConversation) {
        return res.status(200).json(existingConversation);
      }
    }

    const conversation = await Conversation.create({
      isGroup: isGroup || false,
      name: isGroup ? name : null,
      members: memberIds
    });

    const populatedConversation = await conversation.populate("members", "username email avatarUrl isOnline lastSeen");

    res.status(201).json(populatedConversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.user.id
    })
      .populate("members", "username email avatarUrl isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username avatarUrl" }
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const addMemberToGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Only group conversations can add members" });
    }

    if (!conversation.members.some(id => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (conversation.members.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    conversation.members.push(userId);
    await conversation.save();

    const updatedConversation = await conversation.populate("members", "username email avatarUrl isOnline lastSeen");
    res.json(updatedConversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const removeMemberFromGroup = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Only group conversations can remove members" });
    }

    if (!conversation.members.some(id => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    conversation.members = conversation.members.filter(id => id.toString() !== userId);
    await conversation.save();

    const updatedConversation = await conversation.populate("members", "username email avatarUrl isOnline lastSeen");
    res.json(updatedConversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Only group conversations can be updated" });
    }

    if (!conversation.members.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (name) {
      conversation.name = name;
    }

    await conversation.save();

    const updatedConversation = await conversation.populate("members", "username email avatarUrl isOnline lastSeen");
    res.json(updatedConversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Tìm conversation và kiểm tra user có quyền xóa không
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Kiểm tra user có trong conversation không
    if (!conversation.members.some(id => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not authorized to delete this conversation" });
    }
    
    // Xóa tất cả messages trong conversation
    await Message.deleteMany({ conversation: conversationId });
    
    // Xóa conversation
    await Conversation.findByIdAndDelete(conversationId);
    
    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  createConversation, 
  getMyConversations, 
  addMemberToGroup, 
  removeMemberFromGroup,
  updateConversation,
  deleteConversation 
};
