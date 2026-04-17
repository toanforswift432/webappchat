# Hướng Dẫn Sử Dụng Tính Năng Video/Audio Call

## 🎉 Tính năng đã triển khai

Ứng dụng chat của bạn giờ đã có đầy đủ tính năng gọi thoại và video call sử dụng WebRTC!

## 📋 Các bước để chạy

### 1. Backend Setup

```bash
cd Backend/ChatApp.Infrastructure
dotnet ef migrations add AddCallEntities --startup-project ../ChatApp.API
dotnet ef database update --startup-project ../ChatApp.API
```

### 2. Chạy Backend

```bash
cd Backend/ChatApp.API
dotnet run
```

Backend sẽ chạy tại: `http://localhost:5054`

### 3. Chạy Frontend

```bash
cd Frontend
npm install  # Nếu chưa install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🚀 Cách sử dụng

### Bắt đầu cuộc gọi

1. Mở một conversation với người bạn muốn gọi
2. Nhấn vào nút **Phone** (📞) để gọi thoại
3. Hoặc nhấn vào nút **Video** (📹) để gọi video

### Nhận cuộc gọi

1. Khi có cuộc gọi đến, bạn sẽ thấy modal hiện lên
2. Nhấn **Answer** (màu xanh) để trả lời
3. Hoặc nhấn **Reject** (màu đỏ) để từ chối

### Trong cuộc gọi

- **Tắt/Bật Mic**: Nhấn nút microphone
- **Tắt/Bật Camera**: Nhấn nút video (chỉ với video call)
- **Kết thúc cuộc gọi**: Nhấn nút điện thoại màu đỏ

## 🔧 Công nghệ sử dụng

### Backend
- **SignalR**: WebSocket signaling server
- **Entity Framework Core**: Lưu lịch sử cuộc gọi
- **SQL Server**: Database

### Frontend
- **WebRTC**: Peer-to-peer audio/video streaming
- **SignalR Client**: Real-time communication
- **Redux Toolkit**: State management
- **React**: UI components

## 🌐 WebRTC Configuration

Hiện tại đang sử dụng Google STUN server miễn phí:
```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]
```

### Nếu cần TURN server (cho NAT phức tạp)

Bạn có thể cài đặt coturn hoặc sử dụng dịch vụ như:
- **Twilio**: https://www.twilio.com/stun-turn
- **Xirsys**: https://xirsys.com/
- **Metered**: https://www.metered.ca/stun-turn

Cập nhật trong file `Frontend/src/services/webrtc.service.ts`:
```typescript
iceServers: [
  { urls: 'stun:your-stun-server.com' },
  {
    urls: 'turn:your-turn-server.com',
    username: 'your-username',
    credential: 'your-password'
  },
]
```

## 📱 Permissions

Trình duyệt sẽ hỏi quyền truy cập camera và microphone khi bạn bắt đầu hoặc nhận cuộc gọi.

**Lưu ý**:
- Camera/mic permissions chỉ hoạt động trên HTTPS hoặc localhost
- Một số trình duyệt cũ có thể không hỗ trợ WebRTC

## 🐛 Troubleshooting

### Không nghe/nhìn thấy người kia?

1. Kiểm tra console browser (F12) xem có lỗi gì
2. Đảm bảo cả hai người đều đã grant camera/mic permissions
3. Thử refresh trang và gọi lại
4. Kiểm tra firewall không chặn WebRTC

### Không kết nối được?

1. Kiểm tra cả hai người đều online
2. Kiểm tra SignalR connection (xem console)
3. Thử với network khác (có thể NAT/firewall chặn)

### Video bị lag?

1. Giảm chất lượng video trong `webrtc.service.ts`:
```typescript
video: { width: { ideal: 640 }, height: { ideal: 480 } }
```

2. Kiểm tra bandwidth internet

## 🎯 Tính năng nâng cao có thể thêm

- [ ] Screen sharing
- [ ] Group call (3+ người) - cần SFU
- [ ] Recording cuộc gọi
- [ ] Background blur/effects
- [ ] Picture-in-picture mode
- [ ] Call history UI
- [ ] Missed call notifications

## 📝 Database Schema

### Call Table
- Id (Guid)
- ConversationId (Guid)
- InitiatorId (Guid)
- Type (Audio/Video)
- Status (Initiated/Ringing/Active/Ended/Missed/Rejected)
- StartedAt, EndedAt, Duration
- CreatedAt, UpdatedAt

### CallParticipant Table
- Id (Guid)
- CallId (Guid)
- UserId (Guid)
- JoinedAt, LeftAt
- IsVideoEnabled, IsAudioEnabled
- CreatedAt, UpdatedAt

## 🙏 Credits

- WebRTC API: https://webrtc.org/
- SignalR: https://docs.microsoft.com/aspnet/core/signalr/
- STUN servers: Google

---

**Enjoy calling! 📞📹**
