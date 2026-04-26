using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Users;

public record GetBlockedUsersQuery(Guid UserId) : IRequest<Result<List<UserDto>>>;

public class GetBlockedUsersQueryHandler(IBlockedUserRepository blockedUsers, IUserRepository users)
    : IRequestHandler<GetBlockedUsersQuery, Result<List<UserDto>>>
{
    public async Task<Result<List<UserDto>>> Handle(GetBlockedUsersQuery req, CancellationToken ct)
    {
        var blocked = await blockedUsers.GetBlockedUsersAsync(req.UserId, ct);
        var userDtos = new List<UserDto>();

        foreach (var block in blocked)
        {
            var user = await users.GetByIdAsync(block.BlockedUserId, ct);
            if (user is not null)
            {
                userDtos.Add(user.ToDto());
            }
        }

        return Result<List<UserDto>>.Success(userDtos);
    }
}
