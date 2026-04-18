using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record MessageDto(
    Guid Id,
    Guid ConversationId,
    Guid? SenderId,
    string SenderName,
    string? SenderAvatar,
    MessageType Type,
    string? Content,
    string? FileUrl,
    string? FileName,
    long? FileSize,
    Guid? ReplyToMessageId,
    bool IsRecalled,
    bool IsPinned,
    List<ReactionDto> Reactions,
    DateTime CreatedAt
);

public record ReactionDto(string Emoji, List<Guid> UserIds);
