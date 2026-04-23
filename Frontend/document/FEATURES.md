# AmiChat Frontend — Tài liệu Tính năng

## Stack kỹ thuật

| Thành phần | Công nghệ |
|-----------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| State management | Redux Toolkit |
| Real-time | SignalR (`@microsoft/signalr`) |
| Video/Audio call | WebRTC (browser native API) |
| Styling | Tailwind CSS + Dark mode |
| Animation | Framer Motion |
| HTTP client | Axios (với auto refresh token) |
| Đa ngôn ngữ | Custom i18n (vi / en) |

---

## Cấu trúc thư mục

```
src/
├── api.ts                     # Mock data cũ — KHÔNG còn sử dụng trong production
├── App.tsx                    # Root component, điều phối toàn bộ layout & routing
├── config.ts                  # BASE_URL, API_URL, HUB_URL (tự detect dev/prod)
├── index.tsx                  # Entry point
├── index.css                  # Tailwind base + custom styles
├── types.ts                   # UI types (Conversation, Message, User, v.v.)
├── components/                # UI components
├── pages/                     # Trang: Login, Register, Contacts, Profile
├── hooks/                     # Custom hooks: useSignalR, useCall, useCallAudio
├── services/                  # HTTP services: auth, conversation, user, friend, webrtc
├── store/                     # Redux store + slices
│   └── slices/                # authSlice, conversationSlice, messageSlice,
│                              # friendSlice, callSlice, uiSlice
├── types/                     # api.ts (DTO types), mappers.ts
├── i18n/                      # LanguageContext + translations.ts
└── utils/                     # sounds.ts
```

---

## Routing & Navigation

Ứng dụng là **SPA không dùng React Router**, điều hướng qua `activeTab` trong Redux uiSlice:

| Tab | Component | Điều kiện hiển thị |
|-----|-----------|-------|
| `chat` | `Sidebar` + `ChatArea` | Tất cả user đã đăng nhập |
| `contacts` | `ContactsPage` | Tất cả user đã đăng nhập |
| `profile` | `ProfilePage` | Tất cả user đã đăng nhập |
| `admin` | `AdminPage` | Chỉ user có `AccountType = Admin` |

Khi chưa đăng nhập:
- URL `/webchatapp/{inviteCode}` → `RegisterPage` (chế độ đăng ký nhân viên, invite code tự động điền)
- Mọi URL khác → `LoginPage` (có thể chuyển sang `RegisterPage` khách hàng)

---

## Tính năng chi tiết

### 1. Xác thực (Authentication) — Phase 0

**Files:** [LoginPage.tsx](../src/pages/LoginPage.tsx), [RegisterPage.tsx](../src/pages/RegisterPage.tsx), [authSlice.ts](../src/store/slices/authSlice.ts), [auth.service.ts](../src/services/auth.service.ts)

#### Đăng nhập
- Email + mật khẩu
- JWT Access Token + Refresh Token — lưu vào `localStorage`
- Auto refresh khi nhận 401 (Axios interceptor)
- Persist session khi reload trang

#### Đăng ký Khách hàng (`POST /api/auth/register/customer`)
- Form: họ tên, số điện thoại, email, mật khẩu
- Backend gửi OTP 6 số về email (10 phút)
- Bước 2: nhập OTP → xác thực → nhận JWT → đăng nhập ngay

#### Đăng ký Nhân viên (`POST /api/auth/register/employee/{inviteCode}`)
- URL: `/webchatapp/{inviteCode}` — invite code lấy từ URL path
- Form: tương tự khách hàng, invite code hiển thị readonly
- Sau OTP → trạng thái "chờ Admin duyệt" (`requiresApproval = true`)
- Tài khoản chỉ dùng được sau khi Admin phê duyệt

#### Admin duyệt tài khoản
- Tab `admin` trong BottomNav (chỉ hiện với Admin)
- `AdminPage`: danh sách nhân viên chờ duyệt, nút Duyệt / Từ chối
- API: `GET /api/admin/pending-accounts`, `POST /api/admin/accounts/{id}/approve`
- Backend gửi email thông báo kết quả cho nhân viên

#### Đăng xuất
- Xóa token khỏi localStorage, reset toàn bộ Redux state

---

### 2. Danh sách hội thoại (Conversation List)

**Files:** [Sidebar.tsx](../src/components/Sidebar.tsx), [ConversationItem.tsx](../src/components/ConversationItem.tsx), [conversationSlice.ts](../src/store/slices/conversationSlice.ts)

- Hiển thị danh sách tất cả hội thoại (Direct + Group)
- Sắp xếp theo tin nhắn mới nhất (auto-sort khi nhận tin nhắn mới)
- Hiển thị avatar, tên, tin nhắn cuối cùng, thời gian, số tin chưa đọc
- Chỉ báo online (chấm xanh) cho hội thoại 1-1
- Badge số chưa đọc trên từng conversation
- Indicator `[Muted]` cho conversation đã tắt thông báo
- Click vào conversation → load messages + đánh dấu đọc tự động

---

### 3. Chat (Gửi/Nhận tin nhắn)

**Files:** [ChatArea.tsx](../src/components/ChatArea.tsx), [ChatInput.tsx](../src/components/ChatInput.tsx), [MessageBubble.tsx](../src/components/MessageBubble.tsx), [messageSlice.ts](../src/store/slices/messageSlice.ts)

#### Gửi tin nhắn
- Gửi tin nhắn **text** (Enter hoặc nút gửi)
- Upload và gửi **file** (bất kỳ loại)
- Upload và gửi **ảnh** (preview trước khi gửi)
- Gửi tin nhắn với **Reply** — trích dẫn tin nhắn gốc
- Indicator đang gõ (typing indicator) — tự tắt sau 3 giây

#### Nhận tin nhắn (Real-time qua SignalR)
- Nhận tin nhắn ngay lập tức qua SignalR `ReceiveMessage`
- Auto mark read khi conversation đang mở
- Phát âm thanh thông báo khi nhận tin nhắn từ conversation khác

#### Phân trang tin nhắn
- Load 10 tin nhắn/trang khi mở conversation
- Scroll up để load thêm tin nhắn cũ (infinite scroll)

#### Tương tác tin nhắn
- **React emoji** — thêm/bỏ reaction (hiển thị danh sách emoji picker)
- **Thu hồi tin nhắn** — chỉ thu hồi được tin nhắn của chính mình; hiển thị "Tin nhắn đã được thu hồi"
- **Forward tin nhắn** — chuyển tiếp sang conversation khác (`ForwardModal`)
- **Ghim tin nhắn** — (UI có, backend endpoint chưa hoàn thiện)
- **Tin nhắn hệ thống** — hiển thị kiểu khác (tham gia nhóm, đổi tên, v.v.)

#### Hiển thị nội dung
- Text thuần
- **Ảnh** — click để xem fullscreen (`ImageLightbox`)
- **File** — hiển thị icon + tên + kích thước + link download
- **Reply preview** — hiển thị khung trích dẫn phía trên
- **Reaction bar** — hiển thị emoji + số lượng bên dưới tin nhắn
- **Typing indicator** — animation "..." khi người kia đang gõ

---

### 4. Nhóm chat (Group Chat)

**Files:** [CreateGroupModal.tsx](../src/components/CreateGroupModal.tsx), [GroupManageModal.tsx](../src/components/GroupManageModal.tsx), [ConversationController (BE)]

- **Tạo nhóm** — đặt tên + chọn thành viên từ danh sách bạn bè
- **Đổi tên nhóm** — chỉ Admin mới làm được
- **Đổi avatar nhóm** — upload ảnh, broadcast real-time cho tất cả thành viên
- **Thêm thành viên** — chỉ Admin; thành viên mới nhận GroupCreated event qua SignalR
- **Kick thành viên** — Admin kick người khác ra khỏi nhóm
- **Rời nhóm** — bất kỳ thành viên nào đều có thể rời
- Mỗi hành động quản lý nhóm tự động tạo **tin nhắn hệ thống** (system message)

---

### 5. Tìm kiếm

**Files:** [GlobalSearchPanel.tsx](../src/components/GlobalSearchPanel.tsx), [MessageSearchPanel.tsx](../src/components/MessageSearchPanel.tsx)

#### Global Search (nhấn icon tìm kiếm ở Sidebar)
- Tìm kiếm người dùng theo tên
- Tìm kiếm hội thoại theo tên
- Tìm kiếm tin nhắn theo nội dung
- Click kết quả → mở chat tương ứng

#### Message Search (trong ChatArea)
- Tìm kiếm tin nhắn trong conversation đang mở

---

### 6. Bạn bè & Liên hệ

**Files:** [ContactsPage.tsx](../src/pages/ContactsPage.tsx), [friendSlice.ts](../src/store/slices/friendSlice.ts), [friend.service.ts](../src/services/friend.service.ts)

ContactsPage có 3 sub-tab:

| Tab | Tính năng |
|-----|-----------|
| **Bạn bè** | Danh sách bạn bè, tìm kiếm, nhắn tin trực tiếp, xóa bạn |
| **Lời mời** | Xem lời mời kết bạn nhận được, chấp nhận / từ chối |
| **Tìm người** | Tìm kiếm người dùng theo tên (debounce 300ms), gửi lời mời kết bạn |

- Badge đỏ trên tab Lời mời khi có lời mời pending
- Badge số trên tab Contacts ở BottomNav khi có lời mời mới
- Real-time: nhận `FriendRequestReceived` / `FriendRequestAccepted` qua SignalR
- Phát âm thanh khi nhận lời mời kết bạn

---

### 7. Video/Audio Call (WebRTC)

**Files:** [VideoCallModal.tsx](../src/components/VideoCallModal.tsx), [IncomingCallModal.tsx](../src/components/IncomingCallModal.tsx), [useCall.ts](../src/hooks/useCall.ts), [webrtc.service.ts](../src/services/webrtc.service.ts), [callSlice.ts](../src/store/slices/callSlice.ts)

#### Luồng gọi
1. **Người gọi**: Click nút call → `initiateCall()` → lấy camera/mic → tạo WebRTC offer → gửi `InitiateCall` qua SignalR
2. **Người nhận**: Nhận `IncomingCall` → hiện `IncomingCallModal` → chấp nhận → tạo answer → gửi `AnswerCall`
3. **Kết nối**: ICE candidate exchange qua `SendIceCandidate` / `IceCandidate` events
4. **Kết thúc**: Gửi `EndCall` → backend lưu system message với thời lượng cuộc gọi

#### Tính năng trong cuộc gọi
- Gọi Audio hoặc Video
- Tắt/bật camera trong khi đang gọi (`ToggleMedia`)
- Tắt/bật micro trong khi đang gọi
- Hiển thị thời gian cuộc gọi (timer)
- Chế độ full-screen cho video
- ICE candidate buffering — không mất candidate khi remote description chưa set
- TURN server credentials lấy từ `/api/turn/credentials`
- Sau khi kết thúc: hiển thị system message "📹 Video call · 1:23" trong chat

#### WebRTC Service (singleton)
- `WebRTCService` là singleton — dùng chung giữa `useCall` và `VideoCallModal`
- Xử lý edge case: ICE candidates đến trước remote description → buffer rồi flush
- Chống duplicate `setRemoteDescription` (flag `remoteAnswerSet`)

---

### 8. Hồ sơ cá nhân (Profile)

**Files:** [ProfilePage.tsx](../src/pages/ProfilePage.tsx), [user.service.ts](../src/services/user.service.ts)

- Xem thông tin: tên, email, avatar
- **Chỉnh sửa tên hiển thị**
- **Đổi ảnh đại diện** — upload file ảnh
- Hiển thị trạng thái online

#### Cài đặt trong Profile
| Cài đặt | Chi tiết |
|---------|---------|
| Dark Mode | Toggle bật/tắt, persist localStorage |
| Thông báo | Bật/tắt: tin nhắn, âm thanh, preview, nhóm, mention |
| Âm thanh tin nhắn | Chọn loại: ding, chime, pop, whoosh, v.v. + preview nghe thử |
| Âm thanh cuộc gọi | Chọn loại riêng cho cuộc gọi |
| Ngôn ngữ | Tiếng Anh / Tiếng Việt |
| Quyền riêng tư | Show online status, read receipts, allow friend requests (lưu localStorage, chưa sync BE) |
| Đăng xuất | Xóa token, reset state |

---

### 9. Thông báo (Notifications)

**Files:** [NotificationPanel.tsx](../src/components/NotificationPanel.tsx), [useSignalR.ts](../src/hooks/useSignalR.ts), [sounds.ts](../src/utils/sounds.ts)

- Panel thông báo mở từ icon chuông trên Sidebar
- Âm thanh tự động phát khi nhận tin nhắn mới (conversation không đang mở)
- Âm thanh riêng cho lời mời kết bạn
- Tùy chỉnh loại âm thanh theo sở thích người dùng
- Badge số hội thoại chưa đọc trên BottomNav

---

### 10. Tắt thông báo hội thoại (Mute)

- Mute/unmute một conversation cụ thể
- Không phát âm thanh khi có tin nhắn mới từ conversation bị mute
- Hiển thị icon muted trên conversation item

---

### 11. Chia sẻ file & Ảnh

**Files:** [SharedFilesPanel.tsx](../src/components/SharedFilesPanel.tsx), [ImageLightbox.tsx](../src/components/ImageLightbox.tsx), [ImagePreview.tsx](../src/components/ImagePreview.tsx), [LazyImage.tsx](../src/components/LazyImage.tsx)

- Upload file/ảnh trong ChatInput
- Preview ảnh trước khi gửi
- `LazyImage` — lazy load ảnh trong danh sách
- `ImageLightbox` — xem ảnh fullscreen, zoom
- `SharedFilesPanel` — xem tất cả file/ảnh đã chia sẻ trong conversation

---

### 12. Trạng thái online

**Files:** [StatusSelector.tsx](../src/components/StatusSelector.tsx)

Người dùng có thể đặt trạng thái:
- Online (Trực tuyến)
- Away (Vắng mặt)
- In a Meeting (Đang họp)
- Work from Home (Làm việc từ xa)
- Offline

Trạng thái được sync lên server và broadcast real-time tới tất cả bạn bè qua `UserOnline` / `UserOffline` SignalR events.

---

### 13. Đa ngôn ngữ (i18n)

**Files:** [LanguageContext.tsx](../src/i18n/LanguageContext.tsx), [translations.ts](../src/i18n/translations.ts)

- Hỗ trợ Tiếng Việt và Tiếng Anh
- Chuyển đổi ngôn ngữ trong Profile → Language
- Persist ngôn ngữ đã chọn vào localStorage

---

## Redux Store

| Slice | State chính | Mô tả |
|-------|-------------|-------|
| `auth` | user, accessToken, refreshToken, isAuthenticated | Auth state, persist localStorage |
| `conversations` | items[], activeId, status | Danh sách conversation + conversation đang chọn |
| `messages` | byConvId{}, loadingConvIds, hasMoreByConvId, pageByConvId | Messages theo từng conversation, phân trang |
| `friends` | friends[], requestDetails[], status | Danh sách bạn + lời mời kết bạn |
| `call` | activeCall, incomingCall, isVideoEnabled, isAudioEnabled | WebRTC call state |
| `ui` | activeTab, isDarkMode, isNotificationsOpen, isSearchOpen, typingConvIds, messageToForward | UI state |

---

## Services (HTTP)

| Service | Endpoints |
|---------|-----------|
| `auth.service.ts` | POST /auth/login, /auth/register, /auth/refresh |
| `conversation.service.ts` | GET/POST conversations, messages, upload, recall, react, mute, group management |
| `user.service.ts` | GET/PUT /users/me, upload avatar, update status, update notifications, search |
| `friend.service.ts` | GET/POST /friends, friend requests, unfriend |
| `webrtc.service.ts` | GET /turn/credentials (không phải HTTP service thuần — quản lý WebRTC peer connection) |

---

## Real-time Events (SignalR)

### Nhận từ server
| Event | Xử lý |
|-------|-------|
| `ReceiveMessage` | Thêm vào messageSlice, update lastMessage, phát âm thanh |
| `MessageRecalled` | Đánh dấu isRecalled trong messageSlice |
| `ReactionToggled` | Cập nhật reactions trong messageSlice |
| `UserOnline` / `UserOffline` | Cập nhật trạng thái trong friendSlice + conversationSlice |
| `UserTyping` | Cập nhật typingConvIds trong uiSlice (auto clear 3s) |
| `FriendRequestReceived` | Re-fetch friend requests, phát âm thanh |
| `FriendRequestAccepted` | Re-fetch friends + requests |
| `GroupCreated` | Thêm conversation mới vào store |
| `GroupAvatarUpdated` | Cập nhật avatar trong conversationSlice |
| `GroupRenamed` | Đổi tên trong conversationSlice |
| `MemberKicked` / `MemberLeft` | Xóa member hoặc xóa conversation khỏi store |
| `IncomingCall` | Set incomingCall trong callSlice, hiện IncomingCallModal |
| `CallAnswered` | Set activeCall status = active, set remote SDP |
| `CallRejected` / `CallEnded` | Clear call state, cleanup WebRTC |
| `IceCandidate` | Thêm ICE candidate vào peer connection |
| `MediaToggled` | Broadcast cho UI biết remote user đổi camera/mic |

### Gửi lên server
| Method | Khi nào |
|--------|---------|
| `SendMessage` | Gửi tin nhắn text qua SignalR (thay thế bằng REST cũng được) |
| `MarkRead` | Khi mở conversation hoặc nhận tin nhắn khi conversation đang mở |
| `Typing` | Khi người dùng đang gõ |
| `InitiateCall` | Bắt đầu gọi |
| `AnswerCall` | Chấp nhận cuộc gọi |
| `RejectCall` | Từ chối cuộc gọi |
| `EndCall` | Kết thúc cuộc gọi |
| `SendIceCandidate` | Trao đổi ICE candidate trong WebRTC |
| `ToggleMedia` | Bật/tắt camera hoặc micro |

---

## Responsive Design

- **Desktop**: Sidebar + ChatArea hiển thị song song
- **Mobile**: Sidebar và ChatArea thay nhau hiển thị (activeConvId kiểm soát)
- `BottomNav` hiển thị trên mobile, ẩn khi đang trong màn hình chat
- Safe area padding cho iOS notch (`pt-safe`, `pb-nav-safe`)

---

## Các tính năng TODO / chưa hoàn thiện

| Tính năng | Trạng thái |
|-----------|-----------|
| Ghim tin nhắn | UI có, backend chưa có endpoint |
| Forward tin nhắn | UI có, backend chưa có endpoint |
| Poll / Bình chọn | UI có (`CreatePollModal`), backend chưa xử lý |
| Quyền riêng tư (Privacy settings) | Lưu localStorage, chưa sync lên server |
| Notification Panel | Component có, chưa kết nối data thực |
| Sticker | Enum có, UI chưa implement đầy đủ |
| Block user | Backend có (`BlockedUsers`), FE chưa có UI |
