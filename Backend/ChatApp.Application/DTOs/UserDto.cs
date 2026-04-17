using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    OnlineStatus Status,
    DateTime? LastSeenAt
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    UserDto User
);
