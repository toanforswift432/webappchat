# API Response Format - AmiChat Backend

## 📋 Format Hiện Tại (Recommended)

### **Success Response** (HTTP 2xx)

Trả data trực tiếp trong response body - **RESTful chuẩn**:

```json
{
  "message": "Operation successful",
  "data": { ... },
  "additionalField": "value"
}
```

**Ví dụ:**

```json
// POST /api/auth/resend-otp - HTTP 200 OK
{
  "message": "OTP has been resent to your email.",
  "maskedEmail": "t***@gmail.com",
  "otpCode": "123456" // Only in dev/test
}
```

---

### **Error Response** (HTTP 4xx/5xx)

Trả error message trong object `error`:

```json
{
  "error": "Detailed error message here"
}
```

**Ví dụ:**

```json
// HTTP 400 Bad Request
{
  "error": "No account found with this email or phone number."
}

// HTTP 401 Unauthorized
{
  "error": "Invalid email or password."
}

// HTTP 500 Internal Server Error
{
  "error": "An unexpected error occurred."
}
```

---

## 🆕 Alternative: Status Code trong Response Body

| Nếu muốn thêm status code vào body (cho Example Use Case |
| -------------------------------------------------------- | ------------------ | ------------------------------ | ---------------------------------- |
| **200 OK**                                               | Success            | GET, PUT thành công            | Get user info, Update profile      |
| **201 Created**                                          | Resource created   | POST tạo mới thành công        | Register user, Create conversation |
| **202 Accepted**                                         | Request accepted   | Async processing               | Send email (queued)                |
| **204 No Content**                                       | Success, no data   | DELETE thành công              | Delete message, Remove friend      |
| **400 Bad Request**                                      | Client error       | Validation fail, logic error   | Invalid OTP, Email exists          |
| **401 Unauthorized**                                     | Not authenticated  | Token không hợp lệ, chưa login | Missing token, Expired JWT         |
| **403 Forbidden**                                        | Not authorized     | Không có quyền truy cập        | Not admin, Not group member        |
| **404 Not Found**                                        | Resource not found | Không tìm thấy data            | User not found, Message not found  |
| **409 Conflict**                                         | Resource conflict  | Duplicate, state conflict      | Email already exists               |
| **422 Unprocessable Entity**                             | Validation error   | Business logic fail            | Cannot delete own account          |
| **429 Too Many Requests**                                | Rate limit         | Quá nhiều request              | OTP resend limit reached           |
| **500 Internal Server Error**                            | Server error       | Lỗi server, exception          | Database error, Unexpected error   |

---

## 📊 Khi Nào Dùng Status Code Nào?

### **2xx - Success**

```csharp
// 200 OK - Default success
return Ok(data);

// 201 Created - Khi tạo resource mới
var newUser = await CreateUser();
return Created($"/api/users/{newUser.Id}", newUser);

// 202 Accepted - Khi async processing
await emailQueue.EnqueueOtpEmail(email, otp);
return Accepted();  // Email sẽ được gửi sau

// 204 No Content - Khi delete/update không cần return data
await DeleteMessage(messageId);
return NoContent();
```

---

## 🆕 Contract Code API Endpoints

### Public Endpoint (for Customer Registration)

**GET /api/contract-codes/active**

- No authentication required
- Returns list of active contract codes for customer dropdown

```json
[
  {
    "id": "uuid",
    "code": "ABC-2024-001",
    "companyName": "ABC Corporation",
    "description": "Contract for ABC Corp customers"
  }
]
```

### Admin Endpoints

**GET /api/admin/contract-codes** (Requires Admin)

- Returns all contract codes with status

```json
[
  {
    "id": "uuid",
    "code": "ABC-2024-001",
    "companyName": "ABC Corporation",
    "description": "Contract for ABC Corp",
    "isActive": true,
    "createdAt": "2026-04-27T10:00:00Z"
  }
]
```

**POST /api/admin/contract-codes** (Requires Admin)

- Create new contract code

**Request:**

```json
{
  "code": "ABC-2024-001",
  "companyName": "ABC Corporation",
  "description": "Optional description"
}
```

**Response:** `200 OK` with created code DTO

**PUT /api/admin/contract-codes/{id}** (Requires Admin)

- Update existing contract code

**Request:**

```json
{
  "code": "ABC-2024-001",
  "companyName": "ABC Corporation Updated",
  "description": "Updated description",
  "isActive": false
}
```

**Response:** `200 OK` with success message

**DELETE /api/admin/contract-codes/{id}** (Requires Admin)

- Delete contract code (only if not used by any customer)

**Response:** `200 OK` with success message or `400 Bad Request` if code is in use

### **4xx - Client Errors**

```csharp
// 400 Bad Request - Validation/logic error
if (user is null)
    return BadRequest(new { error = "User not found" });

// 401 Unauthorized - Không có token hoặc token invalid
if (string.IsNullOrEmpty(token))
    return Unauthorized(new { error = "Authentication required" });

// 403 Forbidden - Có token nhưng không có quyền
if (user.Role != "Admin")
    return Forbid();  // hoặc return StatusCode(403, new { error = "Admin only" });

// 404 Not Found - Resource không tồn tại
var message = await GetMessage(id);
if (message is null)
    return NotFound(new { error = "Message not found" });

// 409 Conflict - Duplicate resource
if (await EmailExists(email))
    return Conflict(new { error = "Email already in use" });

// 422 Unprocessable Entity - Business logic fail
if (user.CannotBeDeleted)
    return UnprocessableEntity(new { error = "Cannot delete admin account" });

// 429 Too Many Requests - Rate limit
if (!user.CanResendOtp())
    return StatusCode(429, new { error = "OTP resend limit reached" });
```

}

// Error - HTTP 400 (có statusCode + timestamp)
{
"statusCode": 400,
"error": "No account found",
"timestamp": "2026-04-22T10:30:00Z"
}

````

### **Option B: Wrapped Response (Full)**

Dùng `ApiResponse<T>` wrapper cho tất cả endpoints:

```json
// Success
{
  "success": true,
  "data": {
    "message": "OTP sent",
    "maskedEmail": "t***@gmail.com"
  },
  "error": null
}

// Error
{
  "success": false,
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "No account found",
    "timestamp": "2026-04-22T10:30:00.123Z"
  }
}
````

**Implementation:**

```csharp
// Backend - ChatApp.Application/Common/ApiResponse.cs
public record ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public ApiError? Error { get; init; }
}

public record ApiError(int StatusCode, string Message, DateTime? Timestamp = null);

// Controller
return Ok(ApiResponse<ResendOtpResponseDto>.Ok(result.Value));
return BadRequest(ApiResponse<object>.Fail("Error message", 400));
```

---

## 🎯 HTTP Status Codes

| Status Code                   | Ý nghĩa            | Khi nào dùng                   |
| ----------------------------- | ------------------ | ------------------------------ |
| **200 OK**                    | Success            | GET, PUT thành công            |
| **201 Created**               | Resource created   | POST tạo mới thành công        |
| **400 Bad Request**           | Client error       | Validation fail, logic error   |
| **401 Unauthorized**          | Not authenticated  | Token không hợp lệ, chưa login |
| **403 Forbidden**             | Not authorized     | Không có quyền truy cập        |
| **404 Not Found**             | Resource not found | Không tìm thấy data            |
| **500 Internal Server Error** | Server error       | Lỗi server, exception          |

---

## ✅ Best Practices Đang Áp Dụng

### 1. **Result Pattern** (.NET)

```csharp
public record Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public string? Error { get; init; }

    public static Result<T> Success(T value)
        => new() { IsSuccess = true, Value = value };

    public static Result<T> Failure(string error)
        => new() { IsSuccess = false, Error = error };
}
```

**Controller xử lý:**

```csharp
var result = await mediator.Send(command, ct);
return result.IsSuccess
    ? Ok(result.Value)           // 200 với data
    : BadRequest(new { error = result.Error });  // 400 với error message
```

### 2. **Consistent Error Messages**

✅ **Tốt:**

```json
{
  "error": "No account found with this email or phone number."
}
```

❌ **Tránh:**

```json
{
  "err": "not found",
  "message": "User doesn't exist"
}
```

### 3. **Development vs Production**

**Development** (dev/test): Trả thêm thông tin debug

```json
{
  "message": "OTP sent",
  "maskedEmail": "t***@gmail.com",
  "otpCode": "123456"  ← Chỉ có ở dev
}
```

**Production**: Không trả sensitive data

```json
{
  "message": "OTP sent",
  "maskedEmail": "t***@gmail.com"
}
```

---

## 📝 Error Messages User-Friendly

### Authentication Errors

| Scenario              | Error Message                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Account không tồn tại | `No account found with this email or phone number.`                                             |
| Chưa verify email     | `Please verify your email before logging in.`                                                   |
| Account chờ duyệt     | `Your account is pending admin approval.`                                                       |
| Account bị từ chối    | `Your account registration was rejected. Please contact admin.`                                 |
| OTP sai               | `Invalid or expired OTP.`                                                                       |
| Đạt limit resend      | `You have reached the maximum OTP resend limit (5 times per 24 hours). Please try again later.` |
| Đã verify rồi         | `This account is already verified. Please login instead.`                                       |

### Validation Errors

| Scenario            | Error Message                  |
| ------------------- | ------------------------------ |
| Email đã tồn tại    | `Email already in use.`        |
| Phone đã tồn tại    | `Phone number already in use.` |
| Password không khớp | `Passwords do not match.`      |
| Invite code sai     | `Invalid invite code.`         |

---

## 🔄 Frontend Handling

### Redux Thunk Pattern

```typescript
export const resendOtpForUnverified = createAsyncThunk(
  "auth/resendOtpForUnverified",
  async (emailOrPhone: string, { rejectWithValue }) => {
    try {
      return await authService.resendOtp(emailOrPhone);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to resend OTP");
    }
  },
);
```

### Component Handling

```typescript
const result = await dispatch(resendOtpForUnverified(email));

if (resendOtpForUnverified.fulfilled.match(result)) {
  // Success: result.payload = ResendOtpResponseDto
  setSuccessMessage(result.payload.message);
} else if (resendOtpForUnverified.rejected.match(result)) {
  // Error: result.payload = error string
  setErrorMessage(result.payload as string);
}
```

---

## 🎨 UI Display Examples

### Success Message

```tsx
{
  successMessage && (
    <div className="bg-green-50 border border-green-200 text-green-700 p-2 rounded">✓ {successMessage}</div>
  );
}
```

### Error Message

```tsx
{
  errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded">✗ {errorMessage}</div>;
}
```

---

## 📌 Notes

- ✅ Luôn trả error message rõ ràng, user-friendly
- ✅ Không expose technical details (stack trace, SQL query)
- ✅ Sử dụng HTTP status code đúng semantic
- ✅ Consistent error object structure: `{ error: "message" }`
- ✅ Frontend luôn check `fulfilled` vs `rejected` match
- ⚠️ **NEVER** trả password, token, sensitive data trong error
- 🔧 Development: có thể trả thêm debug info (như OTP code)
