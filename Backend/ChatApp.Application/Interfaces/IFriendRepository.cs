using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IFriendRepository
{
    Task<FriendRequest?> GetRequestByIdAsync(Guid id, CancellationToken ct = default);
    Task<FriendRequest?> GetPendingRequestAsync(Guid fromId, Guid toId, CancellationToken ct = default);
    Task<List<FriendRequest>> GetPendingRequestsForUserAsync(Guid userId, CancellationToken ct = default);
    Task<List<FriendRequest>> GetSentRequestsAsync(Guid userId, CancellationToken ct = default);
    Task<List<FriendRequest>> GetReceivedRequestsAsync(Guid userId, CancellationToken ct = default);
    Task<List<Friendship>> GetFriendshipsAsync(Guid userId, CancellationToken ct = default);
    Task<List<Friendship>> GetFriendsAsync(Guid userId, CancellationToken ct = default);
    Task<bool> AreFriendsAsync(Guid userAId, Guid userBId, CancellationToken ct = default);
    Task AddRequestAsync(FriendRequest request, CancellationToken ct = default);
    Task AddFriendshipAsync(Friendship a, Friendship b, CancellationToken ct = default);
    void RemoveFriendships(IEnumerable<Friendship> friendships);
    Task<List<Friendship>> GetBothFriendshipsAsync(Guid userAId, Guid userBId, CancellationToken ct = default);
    void UpdateRequest(FriendRequest request);
    void RemoveRequest(FriendRequest request);
}
