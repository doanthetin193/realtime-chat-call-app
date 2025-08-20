const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Development helper endpoints
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .populate('members', 'username email')
            .populate('lastMessage');
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('sender', 'username')
            .populate('conversation', 'name isGroup')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Clean up offline users (utility)
const cleanupOfflineUsers = async (req, res) => {
    try {
        await User.updateMany(
            { isOnline: true },
            { isOnline: false, socketId: '', lastSeen: new Date() }
        );
        res.json({ message: 'All users marked as offline' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getAllConversations, 
    getAllMessages,
    cleanupOfflineUsers
};
