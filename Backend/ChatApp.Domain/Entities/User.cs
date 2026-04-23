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
            // Employee chờ duyệt, Customer & Admin tự approved
            ApprovalStatus = accountType == AccountType.Employee ? ApprovalStatus.Pending : ApprovalStatus.Approved,
            IsVerified = accountType == AccountType.Admin, // Admin seed không cần verify
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
