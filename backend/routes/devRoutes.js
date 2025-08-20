const express = require('express');
const { getAllUsers, getAllConversations, getAllMessages, cleanupOfflineUsers } = require('../controllers/devController');

const router = express.Router();

// Development endpoints - chỉ dùng khi development
if (process.env.NODE_ENV !== 'production') {
    router.get('/users', getAllUsers);
    router.get('/conversations', getAllConversations);
    router.get('/messages', getAllMessages);
    router.post('/cleanup-offline', cleanupOfflineUsers);
}

module.exports = router;
