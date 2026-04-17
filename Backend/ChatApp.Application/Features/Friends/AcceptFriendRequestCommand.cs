using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Friends;

public record AcceptFriendRequestCommand(Guid RequestId, Guid AcceptorId) : IRequest<Result>;

public class AcceptFriendRequestCommandHandler(IFriendRepository friends, IUnitOfWork uow)
    : IRequestHandler<AcceptFriendRequestCommand, Result>
{
    public async Task<Result> Handle(AcceptFriendRequestCommand req, CancellationToken ct)
    {
        var request = await friends.GetRequestByIdAsync(req.RequestId, ct);
        if (request is null) return Result.Failure("Friend request not found.");
        if (request.ToUserId != req.AcceptorId) return Result.Failure("Not authorized.");
        if (request.Status != Domain.Enums.FriendRequestStatus.Pending) return Result.Failure("Request is no longer pending.");

        request.Accept();
        friends.UpdateRequest(request);

        var (a, b) = Friendship.Create(request.FromUserId, request.ToUserId);
        await friends.AddFriendshipAsync(a, b, ct);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
