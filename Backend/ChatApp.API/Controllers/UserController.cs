using ChatApp.Application.Interfaces;
using ChatApp.Application.DTOs;
using ChatApp.Application.Features.Users;
using ChatApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ChatApp.API.Hubs;

namespace ChatApp.API.Controllers;

[Route("api/users")]
public class UserController(IUserRepository users, IUnitOfWork uow, IRedisService redis, IMediator mediator, IStorageService storage, IHubContext<ChatHub> hubContext) : BaseController
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        return Ok(user.ToDto());
    }

    [HttpPost("me/avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("File is empty.");
        using var stream = file.OpenReadStream();
        var objectName = await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);
        var avatarUrl = storage.GetPublicUrl(objectName);

        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        user.UpdateProfile(user.DisplayName, avatarUrl);
        users.Update(user);
        await uow.SaveChangesAsync(ct);
        return Ok(new { avatarUrl });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        user.UpdateProfile(req.DisplayName, req.AvatarUrl);
        users.Update(user);
        await uow.SaveChangesAsync(ct);
        return Ok(user.ToDto());
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

        // Broadcast status update to all connected clients (including sender, frontend will handle)
        await hubContext.Clients.All.SendAsync("UserStatusChanged", CurrentUserId.ToString(), (int)req.Status, ct);

        return Ok();
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required.");
        var results = await users.SearchAsync(q, ct);
        return Ok(results.Select(u => u.ToDto()));
    }

    [HttpPost("{userId}/block")]
    public async Task<IActionResult> BlockUser(Guid userId, CancellationToken ct)
    {
        var result = await mediator.Send(new BlockUserCommand(CurrentUserId, userId), ct);
        if (result.IsSuccess)
        {
            // Broadcast to the blocked user
            await hubContext.Clients.User(userId.ToString()).SendAsync("UserBlocked", CurrentUserId.ToString(), ct);
        }
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpDelete("{userId}/block")]
    public async Task<IActionResult> UnblockUser(Guid userId, CancellationToken ct)
    {
        var result = await mediator.Send(new UnblockUserCommand(CurrentUserId, userId), ct);
        if (result.IsSuccess)
        {
            // Broadcast to the unblocked user
            await hubContext.Clients.User(userId.ToString()).SendAsync("UserUnblocked", CurrentUserId.ToString(), ct);
        }
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpGet("blocked")]
    public async Task<IActionResult> GetBlockedUsers(CancellationToken ct)
    {
        var result = await mediator.Send(new GetBlockedUsersQuery(CurrentUserId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }
}

public record UpdateProfileRequest(string DisplayName, string? AvatarUrl);
public record UpdateStatusRequest(OnlineStatus Status);
public record UpdateNotificationsRequest(bool Sound, bool Messages, bool Groups, bool Mentions, bool Preview, string? MessageSoundType = null, string? CallSoundType = null);
