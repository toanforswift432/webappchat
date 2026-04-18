using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public class BlockedUser : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid BlockedUserId { get; private set; }

    public User User { get; private set; } = default!;
    public User BlockedUserEntity { get; private set; } = default!;

    private BlockedUser() { }

    public static BlockedUser Create(Guid userId, Guid blockedUserId)
        => new() { UserId = userId, BlockedUserId = blockedUserId };
}
