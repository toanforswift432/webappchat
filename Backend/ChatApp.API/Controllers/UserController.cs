using ChatApp.Application.Interfaces;
using ChatApp.Application.DTOs;
using ChatApp.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[Route("api/users")]
public class UserController(IUserRepository users, IUnitOfWork uow, IRedisService redis) : BaseController
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        return Ok(new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(CurrentUserId, ct);
        if (user is null) return NotFound();
        user.UpdateProfile(req.DisplayName, req.AvatarUrl);
        users.Update(user);
        await uow.SaveChangesAsync(ct);
        return Ok(new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Status, user.LastSeenAt));
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
        var dtos = results.Select(u => new UserDto(u.Id, u.Email, u.DisplayName, u.AvatarUrl, u.Status, u.LastSeenAt));
        return Ok(dtos);
    }
}

public record UpdateProfileRequest(string DisplayName, string? AvatarUrl);
public record UpdateStatusRequest(OnlineStatus Status);
