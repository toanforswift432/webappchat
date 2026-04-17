using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record ConversationDto(
    Guid Id,
    string? Name,
    string? AvatarUrl,
    ConversationType Type,
    List<ConversationMemberDto> Members,
    MessageDto? LastMessage,
    int UnreadCount,
    DateTime CreatedAt
);

public record ConversationMemberDto(
    Guid UserId,
    string DisplayName,
    string? AvatarUrl,
    MemberRole Role,
    OnlineStatus Status
);
