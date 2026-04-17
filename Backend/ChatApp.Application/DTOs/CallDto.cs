using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record CallDto(
    Guid Id,
    Guid ConversationId,
    Guid InitiatorId,
    CallType Type,
    CallStatus Status,
    DateTime? StartedAt,
    DateTime? EndedAt,
    TimeSpan? Duration,
    List<CallParticipantDto> Participants,
    DateTime CreatedAt
);

public record CallParticipantDto(
    Guid UserId,
    string DisplayName,
    string? AvatarUrl,
    DateTime? JoinedAt,
    DateTime? LeftAt,
    bool IsVideoEnabled,
    bool IsAudioEnabled
);
