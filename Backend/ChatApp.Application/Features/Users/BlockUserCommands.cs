using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Users;

public record BlockUserCommand(Guid UserId, Guid TargetUserId) : IRequest<Result<bool>>;

public class BlockUserHandler(IBlockedUserRepository blockedUsers, IUnitOfWork uow) : IRequestHandler<BlockUserCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(BlockUserCommand req, CancellationToken ct)
    {
        // Check if already blocked
        var existing = await blockedUsers.GetBlockAsync(req.UserId, req.TargetUserId, ct);
        if (existing is not null)
            return Result<bool>.Failure("User is already blocked.");

        var block = BlockedUser.Create(req.UserId, req.TargetUserId);
        await blockedUsers.AddAsync(block, ct);
        await uow.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}

public record UnblockUserCommand(Guid UserId, Guid TargetUserId) : IRequest<Result<bool>>;

public class UnblockUserHandler(IBlockedUserRepository blockedUsers, IUnitOfWork uow) : IRequestHandler<UnblockUserCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UnblockUserCommand req, CancellationToken ct)
    {
        var block = await blockedUsers.GetBlockAsync(req.UserId, req.TargetUserId, ct);
        if (block is null)
            return Result<bool>.Failure("User is not blocked.");

        blockedUsers.Remove(block);
        await uow.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
