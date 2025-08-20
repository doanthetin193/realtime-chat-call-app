# Realtime Chat & Call App - Backend

## 🚀 Setup & Installation

```bash
cd backend
npm install
npm start
```

Server sẽ chạy trên port 5000 và kết nối MongoDB Atlas.

## 📡 Socket.IO Events

### Client → Server Events

#### Authentication & Connection
```js
// Kết nối với JWT token
const socket = io('http://localhost:5000', {
    auth: { token: 'your-jwt-token' }
});
```

#### Messaging
```js
// Gửi tin nhắn
socket.emit('send_message', {
    conversationId: 'conv_id',
    content: 'Hello!',
    type: 'text', // 'text' | 'image' | 'emoji'
    mediaUrl: '' // optional
});

// Join conversation room
socket.emit('join_conversation', 'conversation_id');
```

#### Typing Indicators
```js
// Bắt đầu gõ
socket.emit('typing_start', { conversationId: 'conv_id' });

// Dừng gõ
socket.emit('typing_stop', { conversationId: 'conv_id' });
```

#### Message Status
```js
// Đánh dấu đã đọc
socket.emit('mark_seen', { 
    messageId: 'msg_id', 
    conversationId: 'conv_id' 
});
```

#### Video Call Signaling
```js
// Gọi user
socket.emit('call_user', {
    targetUserId: 'user_id',
    offer: webrtcOffer,
    conversationId: 'conv_id'
});

// Trả lời cuộc gọi
socket.emit('call_answer', {
    targetUserId: 'caller_id',
    answer: webrtcAnswer
});

// Từ chối cuộc gọi
socket.emit('call_reject', { targetUserId: 'caller_id' });

// Kết thúc cuộc gọi
socket.emit('call_end', { targetUserId: 'other_user_id' });

// ICE candidate
socket.emit('ice_candidate', {
    targetUserId: 'other_user_id',
    candidate: iceCandidate
});
```

### Server → Client Events

```js
// Tin nhắn mới
socket.on('new_message', (message) => {
    // message object with sender info
});

// User online/offline
socket.on('user_online', ({ userId, username }) => {});
socket.on('user_offline', ({ userId, username }) => {});

// Typing indicators
socket.on('user_typing', ({ userId, username, conversationId }) => {});
socket.on('user_stop_typing', ({ userId, conversationId }) => {});

// Message seen
socket.on('message_seen', ({ messageId, userId }) => {});

// Video call events
socket.on('incoming_call', ({ from, fromUsername, offer, conversationId }) => {});
socket.on('call_answered', ({ from, answer }) => {});
socket.on('call_rejected', ({ from }) => {});
socket.on('call_ended', ({ from }) => {});
socket.on('ice_candidate', ({ from, candidate }) => {});

// Errors
socket.on('error', ({ message }) => {});
```

## 🔌 REST API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### User Management
```
GET  /api/user/me              # Get current user info
PUT  /api/user/profile         # Update username/avatar  
GET  /api/user/search?query=   # Search users
GET  /api/user/online          # Get online users
```

### Conversations
```
GET  /api/conversations        # Get my conversations
POST /api/conversations        # Create conversation
POST /api/conversations/:id/members    # Add member to group
DELETE /api/conversations/:id/members  # Remove member from group
```

### Messages
```
GET  /api/messages/:conversationId?limit=20&before=msgId
POST /api/messages
```

### File Upload
```
POST /api/upload/image         # Upload image (multipart/form-data)
```

### Development Helpers
```
GET  /api/dev/users           # Get all users
GET  /api/dev/conversations   # Get all conversations  
GET  /api/dev/messages        # Get latest messages
POST /api/dev/cleanup-offline # Mark all users offline
```

## 🧪 Testing Socket.IO

1. Mở `test-socket.html` trong browser
2. Đăng ký/đăng nhập để lấy JWT token
3. Nhập token vào test page và connect
4. Test các chức năng messaging, typing indicators

## 🗄️ Database Models

### User
```js
{
  email: String (unique),
  username: String,
  passwordHash: String,
  avatarUrl: String,
  lastSeen: Date,
  isOnline: Boolean,
  socketId: String
}
```

### Conversation
```js
{
  isGroup: Boolean,
  name: String,
  members: [ObjectId],
  lastMessage: ObjectId
}
```

### Message
```js
{
  conversation: ObjectId,
  sender: ObjectId,
  content: String,
  type: 'text' | 'image' | 'emoji',
  mediaUrl: String,
  seenBy: [ObjectId]
}
```

## 🔑 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

## ✅ Implemented Features

- ✅ JWT Authentication
- ✅ Socket.IO real-time messaging
- ✅ Online/offline status tracking
- ✅ Typing indicators
- ✅ Message seen status
- ✅ File upload (images)
- ✅ Group chat management
- ✅ Video call signaling (WebRTC preparation)
- ✅ User search
- ✅ Message pagination

## 🔄 Next Steps

1. **Frontend Development** - React + Vite + Tailwind
2. **WebRTC Video Calls** - Implement actual video calling
3. **Push Notifications** - When user offline
4. **Media Storage** - Cloudinary/AWS S3 integration
5. **Production Deploy** - Render deployment setup
