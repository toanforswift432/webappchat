using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class ConversationMember : BaseEntity
{
    public Guid ConversationId { get; private set; }
    public Guid UserId { get; private set; }
    public MemberRole Role { get; private set; } = MemberRole.Member;
    public DateTime? LastReadAt { get; private set; }

    public Conversation Conversation { get; private set; } = default!;
    public User User { get; private set; } = default!;

    private ConversationMember() { }

    public static ConversationMember Create(Guid conversationId, Guid userId, MemberRole role = MemberRole.Member)
        => new() { ConversationId = conversationId, UserId = userId, Role = role };

    public void MarkRead() => LastReadAt = DateTime.UtcNow;
    public void SetRole(MemberRole role) => Role = role;
}
