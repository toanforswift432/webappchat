using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record RegisterCommand(string Email, string Password, string DisplayName) : IRequest<Result<AuthResponseDto>>;

public class RegisterCommandHandler(IUserRepository users, IJwtService jwt, IUnitOfWork uow)
    : IRequestHandler<RegisterCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existing = await users.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Result<AuthResponseDto>.Failure("Email already in use.");

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = User.Create(request.Email, hash, request.DisplayName);

        var accessToken = jwt.GenerateAccessToken(user);
        var refreshToken = jwt.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));

        await users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        var notifSettings = new NotificationSettingsDto(user.NotificationSound, user.NotificationMessages, user.NotificationGroups, user.NotificationMentions, user.NotificationPreview, user.MessageSoundType, user.CallSoundType);
        var dto = new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt, notifSettings);
        return Result<AuthResponseDto>.Success(new AuthResponseDto(accessToken, refreshToken, dto));
    }
}
