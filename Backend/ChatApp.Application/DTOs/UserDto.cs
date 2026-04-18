using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    OnlineStatus Status,
    DateTime? LastSeenAt,
    NotificationSettingsDto NotificationSettings
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
