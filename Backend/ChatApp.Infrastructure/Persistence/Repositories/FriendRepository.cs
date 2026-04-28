using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class FriendRepository(AppDbContext db) : IFriendRepository
{
    public Task<FriendRequest?> GetRequestByIdAsync(Guid id, CancellationToken ct = default)
        => db.FriendRequests.FindAsync([id], ct).AsTask();

    public Task<FriendRequest?> GetPendingRequestAsync(Guid fromId, Guid toId, CancellationToken ct = default)
        => db.FriendRequests.FirstOrDefaultAsync(r =>
            r.FromUserId == fromId && r.ToUserId == toId && r.Status == FriendRequestStatus.Pending, ct);

    public Task<List<FriendRequest>> GetPendingRequestsForUserAsync(Guid userId, CancellationToken ct = default)
        => db.FriendRequests
            .Where(r => r.ToUserId == userId && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public Task<List<FriendRequest>> GetSentRequestsAsync(Guid userId, CancellationToken ct = default)
        => db.FriendRequests
            .Where(r => r.FromUserId == userId && r.Status == FriendRequestStatus.Pending)
            .ToListAsync(ct);

    public Task<List<FriendRequest>> GetReceivedRequestsAsync(Guid userId, CancellationToken ct = default)
        => db.FriendRequests
            .Where(r => r.ToUserId == userId && r.Status == FriendRequestStatus.Pending)
            .ToListAsync(ct);

    public Task<List<Friendship>> GetFriendshipsAsync(Guid userId, CancellationToken ct = default)
        => db.Friendships.Include(f => f.Friend).Where(f => f.UserId == userId).ToListAsync(ct);

    public Task<List<Friendship>> GetFriendsAsync(Guid userId, CancellationToken ct = default)
        => db.Friendships.Where(f => f.UserId == userId).ToListAsync(ct);

    public Task<bool> AreFriendsAsync(Guid userAId, Guid userBId, CancellationToken ct = default)
        => db.Friendships.AnyAsync(f => f.UserId == userAId && f.FriendId == userBId, ct);

    public async Task AddRequestAsync(FriendRequest request, CancellationToken ct = default)
        => await db.FriendRequests.AddAsync(request, ct);

    public async Task AddFriendshipAsync(Friendship a, Friendship b, CancellationToken ct = default)
    {
        await db.Friendships.AddAsync(a, ct);
        await db.Friendships.AddAsync(b, ct);
    }

    public void RemoveFriendships(IEnumerable<Friendship> friendships) => db.Friendships.RemoveRange(friendships);

    public Task<List<Friendship>> GetBothFriendshipsAsync(Guid userAId, Guid userBId, CancellationToken ct = default)
        => db.Friendships.Where(f =>
            (f.UserId == userAId && f.FriendId == userBId) ||
            (f.UserId == userBId && f.FriendId == userAId)).ToListAsync(ct);

    public void UpdateRequest(FriendRequest request) => db.FriendRequests.Update(request);

    public void RemoveRequest(FriendRequest request) => db.FriendRequests.Remove(request);
}
