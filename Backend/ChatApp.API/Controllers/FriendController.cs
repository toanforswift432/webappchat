using ChatApp.Application.Features.Friends;
using ChatApp.Application.Interfaces;
using ChatApp.Application.DTOs;
using ChatApp.API.Hubs;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Controllers;

[Route("api/friends")]
public class FriendController(
    IMediator mediator,
    IFriendRepository friendRepo,
    IUserRepository userRepo,
    IHubContext<ChatHub> hub) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetFriends(CancellationToken ct)
    {
        var friendships = await friendRepo.GetFriendshipsAsync(CurrentUserId, ct);
        var dtos = friendships.Select(f => f.Friend.ToDto());
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
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        // Notify recipient via SignalR
        var sender = await userRepo.GetByIdAsync(CurrentUserId);
        if (sender is not null)
        {
            await hub.Clients
                .Group($"user-{req.ToUserId}")
                .SendAsync("FriendRequestReceived", CurrentUserId, sender.DisplayName, sender.AvatarUrl, ct);
        }

        return Ok();
    }

    [HttpDelete("request/{toUserId}")]
    public async Task<IActionResult> CancelRequest(Guid toUserId, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelFriendRequestCommand(CurrentUserId, toUserId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok();
    }

    [HttpPost("request/{requestId}/accept")]
    public async Task<IActionResult> AcceptRequest(Guid requestId, CancellationToken ct)
    {
        var result = await mediator.Send(new AcceptFriendRequestCommand(requestId, CurrentUserId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        // Notify the original requester that their request was accepted
        var request = await friendRepo.GetRequestByIdAsync(requestId, ct);
        if (request is not null)
        {
            var accepter = await userRepo.GetByIdAsync(CurrentUserId);
            if (accepter is not null)
            {
                await hub.Clients
                    .Group($"user-{request.FromUserId}")
                    .SendAsync("FriendRequestAccepted", CurrentUserId, accepter.DisplayName, ct);
            }
        }

        return Ok();
    }

    [HttpPost("request/{requestId}/reject")]
    public async Task<IActionResult> RejectRequest(Guid requestId, CancellationToken ct)
    {
        var request = await friendRepo.GetRequestByIdAsync(requestId, ct);
        if (request is null) return NotFound();
        if (request.ToUserId != CurrentUserId) return Forbid();
        request.Reject();
        friendRepo.UpdateRequest(request);
        return Ok();
    }

    [HttpDelete("{friendId}")]
    public async Task<IActionResult> Unfriend(Guid friendId, CancellationToken ct)
    {
        var result = await mediator.Send(new UnfriendCommand(CurrentUserId, friendId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        // Notify both users via SignalR
        await hub.Clients.Group($"user-{CurrentUserId}").SendAsync("FriendRemoved", friendId, ct);
        await hub.Clients.Group($"user-{friendId}").SendAsync("FriendRemoved", CurrentUserId, ct);

        return Ok();
    }
}

public record SendFriendRequestRequest(Guid ToUserId);
