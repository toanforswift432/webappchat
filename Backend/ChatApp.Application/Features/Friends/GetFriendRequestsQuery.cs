using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Friends;

public record GetFriendRequestsQuery(Guid UserId) : IRequest<Result<List<FriendRequestDto>>>;

public class GetFriendRequestsQueryHandler(IFriendRepository friends, IUserRepository users)
    : IRequestHandler<GetFriendRequestsQuery, Result<List<FriendRequestDto>>>
{
    public async Task<Result<List<FriendRequestDto>>> Handle(GetFriendRequestsQuery req, CancellationToken ct)
    {
        var requests = await friends.GetPendingRequestsForUserAsync(req.UserId, ct);
        var fromIds = requests.Select(r => r.FromUserId).ToList();
        var senders = (await users.GetByIdsAsync(fromIds, ct)).ToDictionary(u => u.Id);

        var dtos = requests.Select(r =>
        {
            senders.TryGetValue(r.FromUserId, out var sender);
            var userDto = sender is null
                ? new UserDto(r.FromUserId, "", "Unknown", null, Domain.Enums.OnlineStatus.Offline, null)
                : new UserDto(sender.Id, sender.Email, sender.DisplayName, sender.AvatarUrl, sender.Status, sender.LastSeenAt);
            return new FriendRequestDto(r.Id, userDto, r.CreatedAt);
        }).ToList();

        return Result<List<FriendRequestDto>>.Success(dtos);
    }
}
