# 🏫 Classroom Chat & Call App

## 🚀 Features đã hoàn thành

### ✅ Backend (Node.js + Socket.IO)
- **Authentication**: JWT login/register với role leader
- **Classroom Management**: Tạo/quản lý phòng lớp (chỉ leader)
- **Real-time messaging** trong classroom với Socket.IO
- **User management**: Profile, online status
- **File upload**: Image support với Multer
- **Online/Offline status** tracking
- **Typing indicators**
- **Message seen status**
- **Video call signaling** (WebRTC) - hỗ trợ nhóm ≤6 người

### ✅ Frontend (React + Vite + Tailwind)
- **Responsive design** mobile-friendly
- **Authentication UI**: Login/Register forms
- **Classroom UI**: Tạo/join phòng lớp, chat realtime
- **Video Call**: Gọi nhóm, share màn hình, bật/tắt mic/cam
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

### Test Full Application
1. Mở http://localhost:5173
2. Register 2 tài khoản khác nhau
3. Set `isClassLeader: true` cho 1 user trong MongoDB
4. Login leader → tạo classroom → user khác join → test chat và gọi video

## 📱 Cách sử dụng

### Đăng ký tài khoản mới:
1. Click "Don't have an account? Sign up"
2. Nhập email, username, password
3. Click "Sign up"

### Đăng nhập:
1. Nhập email và password
2. Click "Sign in"

### Classroom:
1. **Leader**: Bấm nút 🏫 để tạo phòng lớp mới
2. **Member**: Thấy "All Classrooms" → bấm "Join" để tham gia
3. **Chat**: Click vào classroom → gửi tin nhắn realtime
4. **Video Call**: Bấm 📹 trong classroom → gọi nhóm (≤6 người)

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
- [ ] Quản lý thành viên classroom (thêm/kick)
- [ ] SFU cho video call nhóm lớn (>6 người)
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
