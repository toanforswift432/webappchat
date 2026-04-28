using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Friends;

public record CancelFriendRequestCommand(Guid FromUserId, Guid ToUserId) : IRequest<Result>;

public class CancelFriendRequestCommandHandler(IFriendRepository friends, IUnitOfWork uow)
    : IRequestHandler<CancelFriendRequestCommand, Result>
{
    public async Task<Result> Handle(CancelFriendRequestCommand req, CancellationToken ct)
    {
        var pending = await friends.GetPendingRequestAsync(req.FromUserId, req.ToUserId, ct);
        if (pending is null)
            return Result.Failure("No pending friend request found.");

        friends.RemoveRequest(pending);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
