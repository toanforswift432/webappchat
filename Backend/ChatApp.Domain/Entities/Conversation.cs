using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class Conversation : BaseEntity
{
    public string? Name { get; private set; }
    public string? AvatarUrl { get; private set; }
    public ConversationType Type { get; private set; }
    public Guid? CreatedByUserId { get; private set; }

    public ICollection<ConversationMember> Members { get; private set; } = [];
    public ICollection<Message> Messages { get; private set; } = [];

    private Conversation() { }

    public static Conversation CreateDirect()
        => new() { Type = ConversationType.Direct };

    public static Conversation CreateGroup(string name, Guid createdByUserId, string? avatarUrl = null)
        => new() { Type = ConversationType.Group, Name = name, CreatedByUserId = createdByUserId, AvatarUrl = avatarUrl };

    public void UpdateGroup(string name, string? avatarUrl)
    {
        Name = name;
        AvatarUrl = avatarUrl;
        SetUpdatedAt();
    }
}
