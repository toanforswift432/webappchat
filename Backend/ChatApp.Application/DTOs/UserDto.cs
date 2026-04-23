using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    string? AvatarUrl,
    OnlineStatus Status,
    DateTime? LastSeenAt,
    AccountType AccountType,
    ApprovalStatus ApprovalStatus,
    bool IsVerified,
    NotificationSettingsDto NotificationSettings
);

public record PendingEmployeeDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    DateTime CreatedAt
);

public record NotificationSettingsDto(
    bool Sound,
    bool Messages,
    bool Groups,
    bool Mentions,
    bool Preview,
    string? MessageSoundType = "ding",
    string? CallSoundType = "chime"
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    UserDto User
);
