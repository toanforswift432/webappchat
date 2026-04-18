using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class BlockedUserRepository(AppDbContext db) : IBlockedUserRepository
{
    public async Task<List<BlockedUser>> GetBlockedUsersAsync(Guid userId, CancellationToken ct = default)
        => await db.BlockedUsers
            .Where(b => b.UserId == userId)
            .Include(b => b.BlockedUserEntity)
            .ToListAsync(ct);

    public async Task<bool> IsBlockedAsync(Guid userId, Guid targetUserId, CancellationToken ct = default)
        => await db.BlockedUsers
            .AnyAsync(b => (b.UserId == userId && b.BlockedUserId == targetUserId) ||
                          (b.UserId == targetUserId && b.BlockedUserId == userId), ct);

    public async Task<BlockedUser?> GetBlockAsync(Guid userId, Guid blockedUserId, CancellationToken ct = default)
        => await db.BlockedUsers
            .FirstOrDefaultAsync(b => b.UserId == userId && b.BlockedUserId == blockedUserId, ct);

    public async Task AddAsync(BlockedUser blockedUser, CancellationToken ct = default)
    {
        await db.BlockedUsers.AddAsync(blockedUser, ct);
    }

    public void Remove(BlockedUser blockedUser)
    {
        db.BlockedUsers.Remove(blockedUser);
    }
}
