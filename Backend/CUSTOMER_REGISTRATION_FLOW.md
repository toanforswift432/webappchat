# Customer Registration Flow - Updated

## Overview

Đã cập nhật flow đăng ký Customer với quy trình mới:

- Customer không nhập password khi đăng ký
- Chờ admin duyệt
- Admin duyệt → gửi OTP + link verification (valid 1 giờ)
- Customer verify OTP → set password → login

---

## 🔄 Customer Registration Flow (Updated)

### 1️⃣ Customer Registration

**Endpoint:** `POST /api/auth/register/customer`

**Request Body:**

```json
{
  "email": "customer@example.com",
  "displayName": "John Doe",
  "phoneNumber": "+84901234567",
  "contractCodeId": "uuid",
  "registrationNote": "Optional note from customer for admin review"
}
```

**Response:**

```json
{
  "message": "Registration successful. Your account is pending admin approval. You will receive an email with verification instructions once approved."
}
```

**Process:**

- Customer chọn mã hợp đồng từ danh sách active codes (`GET /api/contract-codes/active`)
- Có thể thêm ghi chú (registrationNote) cho admin
- Tạo Customer account với `ApprovalStatus = Pending`
- **Không** có password (PasswordHash = empty)
- Lưu ContractCodeId và RegistrationNote vào database
- Gửi email thông báo đăng ký thành công, chờ admin duyệt

---

### 2️⃣ Admin Reviews Pending Accounts

**Endpoint:** `GET /api/admin/pending-accounts`

**Response:**

```json
[
  {
    "id": "uuid",
    "email": "customer@example.com",
    "displayName": "John Doe",
    "phoneNumber": "+84901234567",
    "accountType": "Customer",
    "createdAt": "2026-04-27T10:00:00Z",
    "contractCodeId": "uuid",
    "contractCode": "ABC-2024-001",
    "companyName": "ABC Corporation",
    "registrationNote": "Optional note from customer"
  }
]
```

**Note:** Trả về cả Customer và Employee pending accounts.
**New Fields:**

- `contractCode`: Mã hợp đồng customer đã chọn
- `companyName`: Tên công ty tương ứng với mã hợp đồng
- `registrationNote`: Ghi chú của customer cho admin (có thể null)

---

### 3️⃣ Admin Approves Customer Account

**Endpoint:** `POST /api/admin/accounts/{userId}/approve`

**Request Body:**

```json
{
  "approve": true
}
```

**Response:**

```json
{
  "approved": true
}
```

**Process (when approve = true for Customer):**

1. Set `ApprovalStatus = Approved`
2. Generate OTP (6 digits, valid 10 minutes)
3. Generate verification token (Base64 URL-safe, valid **1 hour**)
4. Send email với:
   - OTP code
   - Link: `https://yourapp.com/verify-account/{verificationToken}`

**Email Content Example:**

```
Tài khoản của bạn đã được duyệt!

Để kích hoạt tài khoản:
1. Click link bên dưới
2. Nhập OTP: 123456
3. Thiết lập mật khẩu
4. Đăng nhập

[Link Xác Thực Tài Khoản]

⚠️ Link này chỉ có hiệu lực trong 1 giờ.
```

---

### 4️⃣ Customer Verifies Account

**Endpoint:** `POST /api/auth/verify-account`

**Request Body:**

```json
{
  "token": "base64-url-safe-token-from-link",
  "otpCode": "123456"
}
```

**Response:**

```json
{
  "message": "Account verified successfully. Please set your password to complete registration.",
  "userId": "uuid"
}
```

**Validations:**

- Token must be valid and not expired (< 1 hour)
- OTP must be valid and not expired (< 10 minutes)
- Account must be `Approved` status
- Account type must be `Customer`

**Process:**

- Set `IsVerified = true`
- Clear verification token
- Clear OTP

---

### 5️⃣ Customer Sets Password

**Endpoint:** `POST /api/auth/set-password`

**Request Body:**

```json
{
  "userId": "uuid",
  "password": "MySecurePass123"
}
```

**Response:**

```json
{
  "message": "Password set successfully. You can now login with your email and password."
}
```

**Validations:**

- User must exist
- Account type must be `Customer`
- Account must be `IsVerified = true`
- Account must be `ApprovalStatus = Approved`
- Password must be at least 6 characters

---

### 6️⃣ Customer Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "emailOrPhone": "customer@example.com",
  "password": "MySecurePass123"
}
```

**Response:**

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "email": "customer@example.com",
    "displayName": "John Doe",
    ...
  }
}
```

---

## 🔄 Employee Registration Flow (Unchanged)

Employee flow giữ nguyên như cũ:

1. `POST /api/auth/register/employee/{inviteCode}` - nhập password khi đăng ký
2. Verify OTP
3. Chờ admin approve
4. Login sau khi approved

---

## ⏱️ Token & OTP Expiry

| Item                   | Valid Duration | Action When Expired                        |
| ---------------------- | -------------- | ------------------------------------------ |
| **OTP Code**           | 10 minutes     | Admin re-approve để gửi lại OTP + link mới |
| **Verification Token** | 1 hour         | Admin re-approve để gửi lại OTP + link mới |
| **JWT Access Token**   | 15 minutes     | Use refresh token                          |
| **JWT Refresh Token**  | 30 days        | Login again                                |

---

## 🔐 Security Notes

1. **Verification Token:**
   - Generated using `RandomNumberGenerator.Create()`
   - 32 random bytes → Base64 URL-safe encoding
   - Unique per user approval
   - Stored in database with expiry time

2. **Link Format:**

   ```
   https://yourapp.com/verify-account/{verificationToken}
   ```

   - Token is URL-safe (no `+`, `/`, `=`)
   - Cannot be guessed or brute-forced

3. **Re-approval:**
   - If link expires (> 1 hour), user cannot verify
   - Admin must re-approve from pending list
   - New OTP + new token will be generated and sent

---

## 📧 Email Templates

### Registration Pending Email

- Subject: "AmiChat — Đăng ký tài khoản thành công"
- Content: Thông báo đăng ký thành công, chờ admin duyệt

### Approval Email (Customer)

- Subject: "AmiChat — Tài khoản của bạn đã được duyệt"
- Content: OTP code + verification link + instructions

### Approval Email (Employee)

- Subject: "AmiChat — Tài khoản của bạn đã được duyệt"
- Content: Thông báo approved, có thể login

### Rejection Email

- Subject: "AmiChat — Tài khoản của bạn đã bị từ chối"
- Content: Thông báo rejected, liên hệ admin

---

## 🆕 Database Changes

### User Entity Updates

**New Fields:**

```csharp
public string? VerificationToken { get; private set; }
public DateTime? VerificationTokenExpiresAt { get; private set; }
```

**New Methods:**

```csharp
public static User CreateCustomerWithoutPassword(email, displayName, phoneNumber)
public void SetVerificationToken(token, expiresAt)
public bool VerifyToken(token)
public void ClearVerificationToken()
public void SetPassword(passwordHash)
```

**Updated Logic:**

- `ApprovalStatus` cho Customer giờ là `Pending` (không còn auto-approved)

---

## 🧪 Testing Scenarios

### Happy Path

1. Customer registers → receives "pending approval" email
2. Admin approves → customer receives OTP + link
3. Customer clicks link within 1 hour → enters OTP
4. Customer sets password
5. Customer logs in successfully

### Expired Link

1. Customer registers → admin approves
2. Customer waits > 1 hour
3. Customer clicks link → "Verification link has expired"
4. Admin re-approves → new OTP + new link sent
5. Customer verifies within 1 hour → success

### Invalid OTP

1. Customer clicks valid link
2. Customer enters wrong OTP → "Invalid or expired OTP"
3. Customer can retry with correct OTP (if still within 10 min)

---

## 📝 Migration Required

Run migration to add `VerificationToken` and `VerificationTokenExpiresAt` columns:

```bash
cd Backend/ChatApp.Infrastructure
dotnet ef migrations add AddCustomerVerificationFlow --startup-project ../ChatApp.API
dotnet ef database update --startup-project ../ChatApp.API
```

---

## ⚙️ Configuration

Add to `appsettings.json`:

```json
{
  "Frontend": {
    "BaseUrl": "http://localhost:5173"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromAddress": "noreply@amichat.com",
    "FromName": "AmiChat",
    "EnableSsl": "true"
  }
}
```

---

## 🎯 Key Differences: Customer vs Employee

| Feature                        | Customer                                           | Employee                           |
| ------------------------------ | -------------------------------------------------- | ---------------------------------- |
| **Password on Registration**   | ❌ No                                              | ✅ Yes                             |
| **Invite Code Required**       | ❌ No                                              | ✅ Yes                             |
| **Approval Process**           | Pending → Admin approves → OTP+Link → Set password | Pending → Admin approves → Login   |
| **Verification Link**          | ✅ Yes (1 hour)                                    | ❌ No                              |
| **OTP Usage**                  | To verify account link                             | To verify email after registration |
| **Can Login After Verify OTP** | ❌ No (must set password first)                    | ✅ Yes (if approved)               |

---

## 📌 Summary

**Old Customer Flow:**

```
Register (with password) → Verify OTP → Login immediately
```

**New Customer Flow:**

```
Register (no password) → Wait admin approval →
Receive OTP+Link → Click link + Verify OTP →
Set password → Login
```

**Employee Flow (unchanged):**

```
Register (with password + invite code) → Verify OTP →
Wait admin approval → Login
```
