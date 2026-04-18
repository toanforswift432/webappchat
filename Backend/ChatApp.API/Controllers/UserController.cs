using ChatApp.Application.Interfaces;
using ChatApp.Application.DTOs;
using ChatApp.Application.Features.Users;
using ChatApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[Route("api/users")]
public class UserController(IUserRepository users, IUnitOfWork uow, IRedisService redis, IMediator mediator) : BaseController
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        var notifSettings = new NotificationSettingsDto(user.NotificationSound, user.NotificationMessages, user.NotificationGroups, user.NotificationMentions, user.NotificationPreview, user.MessageSoundType, user.CallSoundType);
        return Ok(new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt, notifSettings));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        user.UpdateProfile(req.DisplayName, req.AvatarUrl);
        users.Update(user);
        await uow.SaveChangesAsync(ct);
        var notifSettings = new NotificationSettingsDto(user.NotificationSound, user.NotificationMessages, user.NotificationGroups, user.NotificationMentions, user.NotificationPreview, user.MessageSoundType, user.CallSoundType);
        return Ok(new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt, notifSettings));
    }

    [HttpPut("me/notifications")]
    public async Task<IActionResult> UpdateNotifications([FromBody] UpdateNotificationsRequest req, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        user.UpdateNotificationSettings(req.Sound, req.Messages, req.Groups, req.Mentions, req.Preview, req.MessageSoundType, req.CallSoundType);
        users.Update(user);
        await uow.SaveChangesAsync(ct);
        var notifSettings = new NotificationSettingsDto(user.NotificationSound, user.NotificationMessages, user.NotificationGroups, user.NotificationMentions, user.NotificationPreview, user.MessageSoundType, user.CallSoundType);
        return Ok(notifSettings);
    }

    [HttpPut("me/status")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusRequest req, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        user.SetStatus(req.Status);
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        if (req.Status == OnlineStatus.Offline)
            await redis.SetUserOfflineAsync(CurrentUserId);
        else
            await redis.SetUserOnlineAsync(CurrentUserId);

        return Ok();
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required.");
        var results = await users.SearchAsync(q, ct);
        var dtos = results.Select(u =>
        {
            var notifSettings = new NotificationSettingsDto(u.NotificationSound, u.NotificationMessages, u.NotificationGroups, u.NotificationMentions, u.NotificationPreview, u.MessageSoundType, u.CallSoundType);
            return new UserDto(u.Id, u.Email, u.DisplayName, u.AvatarUrl, u.Status, u.LastSeenAt, notifSettings);
        });
        return Ok(dtos);
    }

    [HttpPost("{userId}/block")]
    public async Task<IActionResult> BlockUser(Guid userId, CancellationToken ct)
    {
        var result = await mediator.Send(new BlockUserCommand(CurrentUserId, userId), ct);
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpDelete("{userId}/block")]
    public async Task<IActionResult> UnblockUser(Guid userId, CancellationToken ct)
    {
        var result = await mediator.Send(new UnblockUserCommand(CurrentUserId, userId), ct);
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }
}

public record UpdateProfileRequest(string DisplayName, string? AvatarUrl);
public record UpdateStatusRequest(OnlineStatus Status);
public record UpdateNotificationsRequest(bool Sound, bool Messages, bool Groups, bool Mentions, bool Preview, string? MessageSoundType = null, string? CallSoundType = null);
