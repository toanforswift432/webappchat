using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponseDto>>;

public class LoginCommandHandler(IUserRepository users, IJwtService jwt, IUnitOfWork uow)
    : IRequestHandler<LoginCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await users.GetByEmailAsync(request.Email, ct);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponseDto>.Failure("Invalid email or password.");

        if (!user.IsVerified)
            return Result<AuthResponseDto>.Failure("Please verify your email before logging in.");

        if (user.ApprovalStatus == ApprovalStatus.Pending)
            return Result<AuthResponseDto>.Failure("Your account is pending admin approval.");

        if (user.ApprovalStatus == ApprovalStatus.Rejected)
            return Result<AuthResponseDto>.Failure("Your account registration was rejected. Please contact admin.");

        var accessToken = jwt.GenerateAccessToken(user);
        var refreshToken = jwt.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));

        // Set user status to Online when logging in
        user.SetStatus(OnlineStatus.Online);

        users.Update(user);
        await uow.SaveChangesAsync(ct);

        return Result<AuthResponseDto>.Success(new AuthResponseDto(accessToken, refreshToken, user.ToDto()));
    }
}
