using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record RefreshTokenCommand(string RefreshToken) : IRequest<Result<AuthResponseDto>>;

public class RefreshTokenCommandHandler(IUserRepository users, IJwtService jwt, IUnitOfWork uow)
    : IRequestHandler<RefreshTokenCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        // In a real system we'd look up the refresh token in DB; simplified: scan by token
        // TODO: add index on RefreshToken for performance
        var user = await users.GetByRefreshTokenAsync(request.RefreshToken, ct);
        if (user is null || user.RefreshTokenExpiresAt < DateTime.UtcNow)
            return Result<AuthResponseDto>.Failure("Invalid or expired refresh token.");

        var newAccess = jwt.GenerateAccessToken(user);
        var newRefresh = jwt.GenerateRefreshToken();
        user.SetRefreshToken(newRefresh, DateTime.UtcNow.AddDays(30));
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        var dto = new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt);
        return Result<AuthResponseDto>.Success(new AuthResponseDto(newAccess, newRefresh, dto));
    }
}
