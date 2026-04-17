using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class Message : BaseEntity
{
    public Guid ConversationId { get; private set; }
    public Guid SenderId { get; private set; }
    public MessageType Type { get; private set; }
    public string? Content { get; private set; }
    public string? FileUrl { get; private set; }
    public string? FileName { get; private set; }
    public long? FileSize { get; private set; }
    public Guid? ReplyToMessageId { get; private set; }
    public bool IsRecalled { get; private set; }
    public bool IsPinned { get; private set; }

    public Conversation Conversation { get; private set; } = default!;
    public User Sender { get; private set; } = default!;
    public Message? ReplyToMessage { get; private set; }
    public ICollection<MessageReaction> Reactions { get; private set; } = [];

    private Message() { }

    public static Message CreateText(Guid conversationId, Guid senderId, string content, Guid? replyToId = null)
        => new()
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Type = MessageType.Text,
            Content = content,
            ReplyToMessageId = replyToId
        };

    public static Message CreateFile(Guid conversationId, Guid senderId, string fileUrl, string fileName, long fileSize, MessageType type = MessageType.File)
        => new()
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Type = type,
            FileUrl = fileUrl,
            FileName = fileName,
            FileSize = fileSize
        };

    public void Recall()
    {
        IsRecalled = true;
        Content = null;
        SetUpdatedAt();
    }

    public void TogglePin()
    {
        IsPinned = !IsPinned;
        SetUpdatedAt();
    }
}
