# 💬 Real-time Chat & Call App

## 🚀 Features đã hoàn thành

### ✅ Backend (Node.js + Socket.IO)
- **Authentication**: JWT login/register
- **Real-time messaging** với Socket.IO
- **User management**: Profile, search users
- **File upload**: Image support với Multer
- **Online/Offline status** tracking
- **Typing indicators**
- **Message seen status**
- **Video call signaling** (WebRTC ready)

### ✅ Frontend (React + Vite + Tailwind)
- **Responsive design** mobile-friendly
- **Authentication UI**: Login/Register forms
- **Real-time chat interface**
- **Conversation management**
- **Typing indicators**
- **Socket.IO integration**

## 🛠️ Setup & Development

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Server sẽ chạy trên http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy trên http://localhost:5173

## 🧪 Testing

### 1. Test API endpoints
```bash
cd backend
node test-api.js
```

### 2. Test Socket.IO
Mở file `backend/test-socket.html` trong browser

### 3. Test Full Application
1. Mở http://localhost:5173
2. Register tài khoản mới
3. Login và test chat

## 📱 Cách sử dụng

### Đăng ký tài khoản mới:
1. Click "Don't have an account? Sign up"
2. Nhập email, username, password
3. Click "Sign up"

### Đăng nhập:
1. Nhập email và password
2. Click "Sign in"

### Chat:
1. Click nút ✏️ để tạo chat mới
2. Search username để tìm người chat
3. Click vào user để tạo conversation
4. Gõ tin nhắn và Enter để gửi

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### User Management
- `GET /api/user/me` - Thông tin user hiện tại
- `GET /api/user/search?query=...` - Tìm kiếm user
- `PUT /api/user/profile` - Cập nhật profile

### Conversations
- `GET /api/conversations` - Danh sách cuộc trò chuyện
- `POST /api/conversations` - Tạo cuộc trò chuyện mới

### Messages
- `GET /api/messages/:conversationId` - Lấy tin nhắn
- `POST /api/messages` - Gửi tin nhắn

### File Upload
- `POST /api/upload/image` - Upload ảnh

## ⚡ Socket.IO Events

### Client → Server
- `join_conversation` - Join vào room
- `send_message` - Gửi tin nhắn
- `typing_start` - Bắt đầu typing
- `typing_stop` - Dừng typing

### Server → Client
- `new_message` - Tin nhắn mới
- `user_typing` - User đang typing
- `user_online` - User online
- `user_offline` - User offline

## 🎯 Tính năng sắp tới
- [ ] Group chat management
- [ ] Video calling với WebRTC
- [ ] File/image sharing trong chat
- [ ] Push notifications
- [ ] Message reactions
- [ ] Dark mode
- [ ] Mobile app (React Native)

## 🐛 Known Issues
- Server có thể crash khi test load cao
- Cần optimize Socket.IO connection
- UI cần polish thêm

## 📞 Support
- Backend: Port 5000
- Frontend: Port 5173
- Database: MongoDB Atlas

Enjoy chatting! 🎉
