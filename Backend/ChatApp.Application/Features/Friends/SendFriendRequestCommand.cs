using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Friends;

public record SendFriendRequestCommand(Guid FromUserId, Guid ToUserId) : IRequest<Result>;

public class SendFriendRequestCommandHandler(IFriendRepository friends, IUnitOfWork uow)
    : IRequestHandler<SendFriendRequestCommand, Result>
{
    public async Task<Result> Handle(SendFriendRequestCommand req, CancellationToken ct)
    {
        if (req.FromUserId == req.ToUserId)
            return Result.Failure("Cannot send friend request to yourself.");

        if (await friends.AreFriendsAsync(req.FromUserId, req.ToUserId, ct))
            return Result.Failure("Already friends.");

        var pending = await friends.GetPendingRequestAsync(req.FromUserId, req.ToUserId, ct);
        if (pending is not null)
            return Result.Failure("Friend request already sent.");

        await friends.AddRequestAsync(FriendRequest.Create(req.FromUserId, req.ToUserId), ct);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
