using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IBlockedUserRepository
{
    Task<List<BlockedUser>> GetBlockedUsersAsync(Guid userId, CancellationToken ct = default);
    Task<bool> IsBlockedAsync(Guid userId, Guid targetUserId, CancellationToken ct = default);
    Task<BlockedUser?> GetBlockAsync(Guid userId, Guid blockedUserId, CancellationToken ct = default);
    Task AddAsync(BlockedUser blockedUser, CancellationToken ct = default);
    void Remove(BlockedUser blockedUser);
}
