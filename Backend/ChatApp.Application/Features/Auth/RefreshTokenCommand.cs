using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
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

        if (user.ApprovalStatus == ApprovalStatus.Rejected)
            return Result<AuthResponseDto>.Failure("Account has been rejected.");

        var newAccess = jwt.GenerateAccessToken(user);
        var newRefresh = jwt.GenerateRefreshToken();
        user.SetRefreshToken(newRefresh, DateTime.UtcNow.AddDays(30));
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        return Result<AuthResponseDto>.Success(new AuthResponseDto(newAccess, newRefresh, user.ToDto()));
    }
}
