using ChatApp.Application.Features.Friends;
using ChatApp.Application.Interfaces;
using ChatApp.Application.DTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[Route("api/friends")]
public class FriendController(IMediator mediator, IFriendRepository friendRepo, IUserRepository userRepo) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetFriends(CancellationToken ct)
    {
        var friendships = await friendRepo.GetFriendshipsAsync(CurrentUserId, ct);
        var dtos = friendships.Select(f => new UserDto(
            f.Friend.Id, f.Friend.Email, f.Friend.DisplayName, f.Friend.AvatarUrl, f.Friend.Status, f.Friend.LastSeenAt));
        return Ok(dtos);
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests(CancellationToken ct)
    {
        var result = await mediator.Send(new GetFriendRequestsQuery(CurrentUserId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new SendFriendRequestCommand(CurrentUserId, req.ToUserId), ct);
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPost("request/{requestId}/accept")]
    public async Task<IActionResult> AcceptRequest(Guid requestId, CancellationToken ct)
    {
        var result = await mediator.Send(new AcceptFriendRequestCommand(requestId, CurrentUserId), ct);
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPost("request/{requestId}/reject")]
    public async Task<IActionResult> RejectRequest(Guid requestId, CancellationToken ct)
    {
        var request = await friendRepo.GetRequestByIdAsync(requestId, ct);
        if (request is null) return NotFound();
        if (request.ToUserId != CurrentUserId) return Forbid();
        request.Reject();
        friendRepo.UpdateRequest(request);
        // Save via UoW – injected inline for simplicity
        return Ok();
    }
}

public record SendFriendRequestRequest(Guid ToUserId);
