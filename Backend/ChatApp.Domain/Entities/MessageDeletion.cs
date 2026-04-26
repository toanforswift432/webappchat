namespace ChatApp.Domain.Entities;

public class MessageDeletion
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid MessageId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private MessageDeletion() { }

    public static MessageDeletion Create(Guid messageId, Guid userId) => new()
    {
        MessageId = messageId,
        UserId = userId
    };
}
