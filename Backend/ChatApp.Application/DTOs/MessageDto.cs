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
)
{
    public bool IsForwarded { get; init; }
    public Guid? ForwardedFromMessageId { get; init; }
    public string? OriginalSenderName { get; init; }
    public string? ReplyToSenderName { get; init; }
    public string? ReplyToContent { get; init; }
    public MessageType? ReplyToType { get; init; }
}

public record ReactionDto(string Emoji, List<Guid> UserIds);
