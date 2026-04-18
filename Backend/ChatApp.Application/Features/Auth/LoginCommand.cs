using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;
using BCrypt.Net;

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

        var accessToken = jwt.GenerateAccessToken(user);
        var refreshToken = jwt.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        var notifSettings = new NotificationSettingsDto(user.NotificationSound, user.NotificationMessages, user.NotificationGroups, user.NotificationMentions, user.NotificationPreview, user.MessageSoundType, user.CallSoundType);
        var dto = new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt, notifSettings);
        return Result<AuthResponseDto>.Success(new AuthResponseDto(accessToken, refreshToken, dto));
    }
}
