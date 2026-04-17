using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public class Friendship : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid FriendId { get; private set; }

    public User User { get; private set; } = default!;
    public User Friend { get; private set; } = default!;

    private Friendship() { }

    public static (Friendship, Friendship) Create(Guid userId, Guid friendId)
    {
        var a = new Friendship { UserId = userId, FriendId = friendId };
        var b = new Friendship { UserId = friendId, FriendId = userId };
        return (a, b);
    }
}
