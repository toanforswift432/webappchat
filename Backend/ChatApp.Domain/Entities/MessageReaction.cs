using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public class MessageReaction : BaseEntity
{
    public Guid MessageId { get; private set; }
    public Guid UserId { get; private set; }
    public string Emoji { get; private set; } = default!;

    public Message Message { get; private set; } = default!;
    public User User { get; private set; } = default!;

    private MessageReaction() { }

    public static MessageReaction Create(Guid messageId, Guid userId, string emoji)
        => new() { MessageId = messageId, UserId = userId, Emoji = emoji };
}
