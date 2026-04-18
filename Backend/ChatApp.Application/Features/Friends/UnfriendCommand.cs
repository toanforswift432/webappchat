using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Friends;

public record UnfriendCommand(Guid UserId, Guid FriendId) : IRequest<Result<bool>>;

public class UnfriendHandler(IFriendRepository friends, IUnitOfWork uow) : IRequestHandler<UnfriendCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UnfriendCommand req, CancellationToken ct)
    {
        var friendships = await friends.GetBothFriendshipsAsync(req.UserId, req.FriendId, ct);
        if (friendships.Count == 0)
            return Result<bool>.Failure("Friendship not found.");

        friends.RemoveFriendships(friendships);
        await uow.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
