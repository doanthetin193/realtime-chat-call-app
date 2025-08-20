const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Store online users
const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new Error('User not found'));
            }
            
            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket auth error:', error.message);
            next(new Error('Authentication error'));
        }
    });

    // Handle connections
    io.on('connection', async (socket) => {
        console.log(`✅ User connected: ${socket.user.username} (${socket.userId})`);
        
        try {
            // Update user online status
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: true,
                socketId: socket.id,
                lastSeen: new Date()
            });
            
            // Store in online users map
            onlineUsers.set(socket.userId, socket.id);
            
            // Broadcast updated online users list
            const onlineUsersList = Array.from(onlineUsers.keys()).map(userId => ({
                userId: userId,
                socketId: onlineUsers.get(userId)
            }));
            console.log('📡 Broadcasting online users:', onlineUsersList);
            io.emit('onlineUsers', onlineUsersList);
            
            // Join user to their conversations
            const conversations = await Conversation.find({ members: socket.userId });
            conversations.forEach(conv => {
                socket.join(conv._id.toString());
                console.log(`📝 Joined conversation: ${conv._id}`);
            });
            
            // Notify others about online status
            console.log('📢 User came online:', socket.userId);
            socket.broadcast.emit('userOnline', {
                userId: socket.userId,
                username: socket.user.username,
                avatarUrl: socket.user.avatarUrl
            });

            // Handle joining a conversation
            socket.on('join_conversation', async (conversationId) => {
                try {
                    const conversation = await Conversation.findById(conversationId);
                    if (conversation && conversation.members.includes(socket.userId)) {
                        socket.join(conversationId);
                        console.log(`📝 User ${socket.user.username} joined conversation ${conversationId}`);
                    } else {
                        socket.emit('error', { message: 'Not authorized to join conversation' });
                    }
                } catch (error) {
                    console.error('Error joining conversation:', error);
                    socket.emit('error', { message: 'Error joining conversation' });
                }
            });

            // Handle sending messages
            socket.on('send_message', async (data) => {
                try {
                    const { conversationId, content, type = 'text', mediaUrl = '' } = data;
                    
                    // Verify user is member of conversation
                    const conversation = await Conversation.findById(conversationId);
                    if (!conversation || !conversation.members.includes(socket.userId)) {
                        return socket.emit('error', { message: 'Unauthorized' });
                    }
                    
                    // Create message
                    const message = await Message.create({
                        conversation: conversationId,
                        sender: socket.userId,
                        content,
                        type,
                        mediaUrl,
                        seenBy: [socket.userId]
                    });
                    
                    // Update conversation's last message
                    conversation.lastMessage = message._id;
                    await conversation.save();
                    
                    // Populate message data
                    const populatedMessage = await message.populate('sender', 'username avatarUrl');
                    
                    // Send to all members in the conversation room
                    io.to(conversationId).emit('new_message', populatedMessage);
                    
                    console.log(`💬 Message sent in conversation ${conversationId}`);
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle typing indicators
            socket.on('typing_start', ({ conversationId }) => {
                socket.to(conversationId).emit('user_typing', {
                    userId: socket.userId,
                    username: socket.user.username,
                    conversationId
                });
            });

            socket.on('typing_stop', ({ conversationId }) => {
                socket.to(conversationId).emit('user_stop_typing', {
                    userId: socket.userId,
                    conversationId
                });
            });

            // Handle message seen
            socket.on('mark_seen', async ({ messageId, conversationId }) => {
                try {
                    await Message.findByIdAndUpdate(messageId, {
                        $addToSet: { seenBy: socket.userId }
                    });
                    
                    socket.to(conversationId).emit('message_seen', {
                        messageId,
                        userId: socket.userId
                    });
                } catch (error) {
                    console.error('Error marking message as seen:', error);
                }
            });

            // Handle video call signaling
            socket.on('call_user', ({ targetUserId, offer, conversationId }) => {
                const targetSocketId = onlineUsers.get(targetUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('incoming_call', {
                        from: socket.userId,
                        fromUsername: socket.user.username,
                        fromAvatar: socket.user.avatarUrl,
                        offer,
                        conversationId
                    });
                } else {
                    socket.emit('call_failed', { message: 'User is offline' });
                }
            });

            socket.on('call_answer', ({ targetUserId, answer }) => {
                const targetSocketId = onlineUsers.get(targetUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call_answered', {
                        from: socket.userId,
                        answer
                    });
                }
            });

            socket.on('call_reject', ({ targetUserId }) => {
                const targetSocketId = onlineUsers.get(targetUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call_rejected', {
                        from: socket.userId
                    });
                }
            });

            socket.on('call_end', ({ targetUserId }) => {
                const targetSocketId = onlineUsers.get(targetUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call_ended', {
                        from: socket.userId
                    });
                }
            });

            socket.on('ice_candidate', ({ targetUserId, candidate }) => {
                const targetSocketId = onlineUsers.get(targetUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('ice_candidate', {
                        from: socket.userId,
                        candidate
                    });
                }
            });

            // Handle disconnect
            socket.on('disconnect', async () => {
                console.log(`❌ User disconnected: ${socket.user.username} (${socket.userId})`);
                
                try {
                    // Update user offline status
                    await User.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        socketId: '',
                        lastSeen: new Date()
                    });
                    
                    // Remove from online users
                    onlineUsers.delete(socket.userId);
                    
                    // Broadcast updated online users list
                    const onlineUsersList = Array.from(onlineUsers.keys()).map(userId => ({
                        userId: userId,
                        socketId: onlineUsers.get(userId)
                    }));
                    console.log('📡 Broadcasting online users after disconnect:', onlineUsersList);
                    io.emit('onlineUsers', onlineUsersList);
                    
                    // Notify others about offline status
                    console.log('📢 User went offline:', socket.userId);
                    socket.broadcast.emit('userOffline', {
                        userId: socket.userId,
                        username: socket.user.username
                    });
                } catch (error) {
                    console.error('Error on disconnect:', error);
                }
            });

        } catch (error) {
            console.error('Error in connection setup:', error);
            socket.emit('error', { message: 'Connection setup failed' });
        }
    });
};
