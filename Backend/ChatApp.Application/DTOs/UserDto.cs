using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public enum FriendshipStatus
{
    None = 0,
    Friend = 1,
    RequestSent = 2,
    RequestReceived = 3
}

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

public record UserSearchResultDto(
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
    FriendshipStatus FriendshipStatus
);

public record PendingEmployeeDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    DateTime CreatedAt
);

public record PendingAccountDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    AccountType AccountType,
    DateTime CreatedAt,
    Guid? ContractCodeId,
    string? ContractCode,
    string? CompanyName,
    string? RegistrationNote
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

public record ColleagueDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    string? AvatarUrl,
    OnlineStatus Status,
    DateTime? LastSeenAt,
    Guid? ContractCodeId,
    string? CompanyName
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    UserDto User
);
