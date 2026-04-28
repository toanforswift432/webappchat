using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string DisplayName { get; private set; } = default!;
    public string? PhoneNumber { get; private set; }
    public string? AvatarUrl { get; private set; }
    public OnlineStatus Status { get; private set; } = OnlineStatus.Offline;
    public DateTime? LastSeenAt { get; private set; }
    public string? RefreshToken { get; private set; }
    public DateTime? RefreshTokenExpiresAt { get; private set; }

    // Account type & approval
    public AccountType AccountType { get; private set; } = AccountType.Customer;
    public ApprovalStatus ApprovalStatus { get; private set; } = ApprovalStatus.Approved;
    public bool IsVerified { get; private set; } = false;
    public string? OtpCode { get; private set; }
    public DateTime? OtpExpiresAt { get; private set; }
    public int OtpResendCount { get; private set; } = 0;
    public DateTime? OtpResendLastResetAt { get; private set; }

    // Verification token for Customer account activation link
    public string? VerificationToken { get; private set; }
    public DateTime? VerificationTokenExpiresAt { get; private set; }

    // Contract Code for Customer (required for registration)
    public Guid? ContractCodeId { get; private set; }
    public ContractCode? ContractCode { get; private set; }
    public string? RegistrationNote { get; private set; }

    // Notification Settings
    public bool NotificationSound { get; private set; } = true;
    public bool NotificationMessages { get; private set; } = true;
    public bool NotificationGroups { get; private set; } = true;
    public bool NotificationMentions { get; private set; } = true;
    public bool NotificationPreview { get; private set; } = true;
    public string MessageSoundType { get; private set; } = "ding";
    public string CallSoundType { get; private set; } = "chime";

    public ICollection<ConversationMember> ConversationMembers { get; private set; } = [];
    public ICollection<Message> SentMessages { get; private set; } = [];
    public ICollection<FriendRequest> SentFriendRequests { get; private set; } = [];
    public ICollection<FriendRequest> ReceivedFriendRequests { get; private set; } = [];
    public ICollection<Friendship> Friendships { get; private set; } = [];

    private User() { }

    public static User Create(string email, string passwordHash, string displayName, string? phoneNumber = null, AccountType accountType = AccountType.Customer)
        => new()
        {
            Email = email,
            PasswordHash = passwordHash,
            DisplayName = displayName,
            PhoneNumber = phoneNumber,
            AccountType = accountType,
            // Customer & Employee đều chờ duyệt, Admin tự approved
            ApprovalStatus = accountType == AccountType.Admin ? ApprovalStatus.Approved : ApprovalStatus.Pending,
            IsVerified = accountType == AccountType.Admin, // Admin seed không cần verify
        };

    // Tạo Customer không có password (chờ admin approve để set password)
    public static User CreateCustomerWithoutPassword(string email, string displayName, string? phoneNumber, Guid contractCodeId, string? registrationNote = null)
        => new()
        {
            Email = email,
            PasswordHash = string.Empty, // Temporary, sẽ set sau khi verify
            DisplayName = displayName,
            PhoneNumber = phoneNumber,
            AccountType = AccountType.Customer,
            ApprovalStatus = ApprovalStatus.Pending,
            IsVerified = false,
            ContractCodeId = contractCodeId,
            RegistrationNote = registrationNote,
        };

    // Tạo Employee không có password (admin tạo trực tiếp, auto-approved)
    public static User CreateEmployeeWithoutPassword(string email, string displayName, string? phoneNumber = null)
        => new()
        {
            Email = email,
            PasswordHash = string.Empty, // Temporary, sẽ set sau khi verify
            DisplayName = displayName,
            PhoneNumber = phoneNumber,
            AccountType = AccountType.Employee,
            ApprovalStatus = ApprovalStatus.Approved, // Admin tạo trực tiếp nên auto-approved
            IsVerified = false, // Vẫn cần verify email
        };

    public static User CreateAdmin(string email, string passwordHash, string displayName)
        => new()
        {
            Email = email,
            PasswordHash = passwordHash,
            DisplayName = displayName,
            AccountType = AccountType.Admin,
            ApprovalStatus = ApprovalStatus.Approved,
            IsVerified = true,
        };

    public void SetOtp(string code, DateTime expiresAt)
    {
        OtpCode = code;
        OtpExpiresAt = expiresAt;
        SetUpdatedAt();
    }

    public bool CanResendOtp()
    {
        // Reset counter nếu đã quá 24h
        if (OtpResendLastResetAt.HasValue && DateTime.UtcNow.Subtract(OtpResendLastResetAt.Value).TotalHours >= 24)
        {
            OtpResendCount = 0;
            OtpResendLastResetAt = null;
        }

        return OtpResendCount < 5;
    }

    public void IncrementResendCount()
    {
        if (!OtpResendLastResetAt.HasValue)
            OtpResendLastResetAt = DateTime.UtcNow;

        OtpResendCount++;
        SetUpdatedAt();
    }

    public bool VerifyOtp(string code)
    {
        if (OtpCode != code || OtpExpiresAt < DateTime.UtcNow)
            return false;
        IsVerified = true;
        OtpCode = null;
        OtpExpiresAt = null;
        // Reset resend counter khi verify thành công
        OtpResendCount = 0;
        OtpResendLastResetAt = null;
        SetUpdatedAt();
        return true;
    }

    public void Approve()
    {
        ApprovalStatus = ApprovalStatus.Approved;
        SetUpdatedAt();
    }

    public void Reject()
    {
        ApprovalStatus = ApprovalStatus.Rejected;
        SetUpdatedAt();
    }

    public void UpdateProfile(string displayName, string? avatarUrl)
    {
        DisplayName = displayName;
        AvatarUrl = avatarUrl;
        SetUpdatedAt();
    }

    public void SetStatus(OnlineStatus status)
    {
        Status = status;
        if (status == OnlineStatus.Offline)
            LastSeenAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void SetRefreshToken(string token, DateTime expiresAt)
    {
        RefreshToken = token;
        RefreshTokenExpiresAt = expiresAt;
        SetUpdatedAt();
    }

    public void RevokeRefreshToken()
    {
        RefreshToken = null;
        RefreshTokenExpiresAt = null;
        SetUpdatedAt();
    }

    public void SetVerificationToken(string token, DateTime expiresAt)
    {
        VerificationToken = token;
        VerificationTokenExpiresAt = expiresAt;
        SetUpdatedAt();
    }

    public bool VerifyToken(string token)
    {
        if (VerificationToken != token || VerificationTokenExpiresAt < DateTime.UtcNow)
            return false;
        return true;
    }

    public void ClearVerificationToken()
    {
        VerificationToken = null;
        VerificationTokenExpiresAt = null;
        SetUpdatedAt();
    }

    public void SetPassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        SetUpdatedAt();
    }

    public void UpdateNotificationSettings(bool sound, bool messages, bool groups, bool mentions, bool preview, string? messageSoundType = null, string? callSoundType = null)
    {
        NotificationSound = sound;
        NotificationMessages = messages;
        NotificationGroups = groups;
        NotificationMentions = mentions;
        NotificationPreview = preview;
        if (messageSoundType != null) MessageSoundType = messageSoundType;
        if (callSoundType != null) CallSoundType = callSoundType;
        SetUpdatedAt();
    }
}
