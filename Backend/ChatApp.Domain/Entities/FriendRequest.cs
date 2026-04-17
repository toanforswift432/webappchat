using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class FriendRequest : BaseEntity
{
    public Guid FromUserId { get; private set; }
    public Guid ToUserId { get; private set; }
    public FriendRequestStatus Status { get; private set; } = FriendRequestStatus.Pending;

    public User FromUser { get; private set; } = default!;
    public User ToUser { get; private set; } = default!;

    private FriendRequest() { }

    public static FriendRequest Create(Guid fromUserId, Guid toUserId)
        => new() { FromUserId = fromUserId, ToUserId = toUserId };

    public void Accept()
    {
        Status = FriendRequestStatus.Accepted;
        SetUpdatedAt();
    }

    public void Reject()
    {
        Status = FriendRequestStatus.Rejected;
        SetUpdatedAt();
    }
}
