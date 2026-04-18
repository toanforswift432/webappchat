using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string DisplayName { get; private set; } = default!;
    public string? AvatarUrl { get; private set; }
    public OnlineStatus Status { get; private set; } = OnlineStatus.Offline;
    public DateTime? LastSeenAt { get; private set; }
    public string? RefreshToken { get; private set; }
    public DateTime? RefreshTokenExpiresAt { get; private set; }

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

    public static User Create(string email, string passwordHash, string displayName)
        => new() { Email = email, PasswordHash = passwordHash, DisplayName = displayName };

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
