# 📋 Message Features - Testing Guide

## ✅ Tính năng đã hoàn thành

### 1. **Forward Message (Chuyển tiếp tin nhắn)** 📤

### 2. **Copy Text (Sao chép tin nhắn)** 📋

### 3. **Delete Message (Xóa vĩnh viễn)** 🗑️

### 4. **Recall Message (Thu hồi)** ↩️

### 5. **@Mention Suggestion** 👥

---

## 🔧 Setup để test

### Backend

```bash
cd Backend/ChatApp.Infrastructure
dotnet ef database update --startup-project ../ChatApp.API

cd ../ChatApp.API
dotnet run
```

### Frontend

```bash
cd Frontend
npm run dev
```

---

## 🧪 Test Cases

### 1️⃣ **Forward Message (Chuyển tiếp)**

#### Test Steps:

1. Mở conversation A, gửi tin nhắn text/image/file
2. Hover message → Click icon **Forward** (→)
3. Modal hiện lên → Search conversation B
4. Click conversation B → Click "Forward"
5. Mở conversation B

#### Expected Results:

✅ Tin nhắn xuất hiện trong conversation B
✅ Có label: `📤 Forwarded from [Tên người gửi gốc]`
✅ Nội dung giữ nguyên (text/image/file)
✅ Nếu tin nhắn gốc có reply → forward cả reply block

---

### 2️⃣ **Copy Text (Sao chép)**

#### Test Steps:

1. Gửi tin nhắn text: "Hello World"
2. Hover message → Click icon **Copy** (📋)
3. Mở notepad/text editor → Paste (Cmd+V)

#### Expected Results:

✅ Text "Hello World" được paste vào notepad
✅ **Chỉ text messages mới có nút Copy** (image/file không có)

---

### 3️⃣ **Delete Message (Xóa vĩnh viễn)** 🗑️

#### Test Steps - Within 3 minutes:

1. Gửi tin nhắn mới
2. **Trong vòng 3 phút**: Hover message
3. Thấy icon **Trash** (🗑️) với tooltip hiển thị thời gian còn lại
4. Click trash icon

#### Expected Results:

✅ Tin nhắn **biến mất hoàn toàn** khỏi cả 2 phía
✅ Không có dòng "Tin nhắn đã được xóa"
✅ Xóa khỏi database

#### Test Steps - After 3 minutes:

1. Gửi tin nhắn
2. **Đợi quá 3 phút**
3. Hover message

#### Expected Results:

✅ **Không thấy** icon Trash 🗑️
✅ Chỉ thấy icon Recall ↩️ (nếu chưa quá 30 phút)

---

### 4️⃣ **Recall Message (Thu hồi)** ↩️

#### Test Steps - Between 3-30 minutes:

1. Gửi tin nhắn
2. **Đợi 3-30 phút**
3. Hover message → Click icon **Recall** (↩️)

#### Expected Results:

✅ Tin nhắn **vẫn hiển thị** nhưng content bị ẩn
✅ Hiện text: `"Tin nhắn đã được thu hồi"` (italic, mờ)
✅ Cả 2 phía đều thấy tin nhắn bị thu hồi

#### Test Steps - After 30 minutes:

1. Gửi tin nhắn
2. **Đợi quá 30 phút**
3. Hover message

#### Expected Results:

✅ **Không thấy** cả Trash lẫn Recall button
✅ Tin nhắn không thể xóa hoặc thu hồi

---

### 5️⃣ **@Mention Suggestion** 👥

#### Test Steps:

1. Mở **group chat** (phải có ≥2 members)
2. Click vào input box
3. Gõ ký tự `@`
4. Dropdown hiện danh sách members

#### Expected Results:

✅ Dropdown xuất hiện với danh sách members
✅ Gõ tiếp chữ sau @ → filter list (vd: `@joh` → chỉ hiện "John")
✅ Click vào member → insert `@John ` vào text (có space sau tên)
✅ Cursor tự động di chuyển sau tên

#### Test Steps - Send mention:

1. Gõ `@John hello` → Send
2. Check tin nhắn đã gửi

#### Expected Results:

✅ `@John` được highlight (màu xanh hoặc nền sáng)
✅ Người nhận (John) thấy mention (nếu có notification)

---

## 🎯 Time Limits Summary

| Action        | Time Limit              | Button Visibility   |
| ------------- | ----------------------- | ------------------- |
| **Delete** 🗑️ | ≤ 3 phút                | Hiện trash icon     |
| **Recall** ↩️ | 3 phút < time ≤ 30 phút | Hiện recall icon    |
| **No action** | > 30 phút               | Không có button nào |

---

## ⚠️ Edge Cases cần test

### Forward:

- [ ] Forward tin nhắn đã bị recalled → Should show error
- [ ] Forward tin nhắn có reply → Reply block có đi kèm không?
- [ ] Forward ảnh/file → URL có đúng không?

### Delete vs Recall:

- [ ] Gửi tin nhắn → Delete ngay (< 3 min) → Check cả 2 phía
- [ ] Gửi tin nhắn → Đợi 3 phút → Chỉ thấy Recall
- [ ] Gửi tin nhắn → Đợi 30 phút → Không thấy button

### @Mention:

- [ ] Gõ `@@` → Dropdown có lỗi không?
- [ ] Gõ `@abc` (không có user) → Dropdown rỗng
- [ ] Gõ `@` ở giữa text → Dropdown có hiện không?
- [ ] 1-on-1 chat → Dropdown **không** hiện (vì không phải group)

---

## 🐛 Known Issues & Limitations

1. **Database migration chưa run**: Cần run `dotnet ef database update` trước khi test
2. **AutoMapper vulnerability warning**: Chỉ là warning, không ảnh hưởng chức năng
3. **@Mention không có notification**: Backend chưa có logic gửi notification khi được mention
4. **Copy chỉ hoạt động với text**: Ảnh/file phải dùng Forward

---

## 📝 Notes

- Tất cả button actions đều có **SignalR real-time sync**
- Time limits được check ở cả **frontend** (UI visibility) và **backend** (validation)
- Forward tạo tin nhắn mới trong target conversation, không phải duplicate
- Delete là **permanent** → không thể khôi phục
- Recall chỉ ẩn content, message record vẫn tồn tại trong DB

---

## ✅ Build Status

- **Backend**: ✅ Build succeeded (warnings only)
- **Frontend**: ✅ Build succeeded (chunk size warnings only)

Ready for testing! 🚀
