using ChatApp.Application.Features.Conversations;
using ChatApp.Application.Features.Messages;
using ChatApp.Application.Interfaces;
using ChatApp.API.Hubs;
using ChatApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Controllers;

[Route("api/conversations")]
public class ConversationController(IMediator mediator, IStorageService storage, IHubContext<ChatHub> hub) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetConversationsQuery(CurrentUserId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("direct")]
    public async Task<IActionResult> GetOrCreateDirect([FromBody] GetOrCreateDirectRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrCreateDirectCommand(CurrentUserId, req.OtherUserId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateGroupCommand(req.Name, CurrentUserId, req.MemberIds), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpGet("{conversationId}/messages")]
    public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMessagesQuery(conversationId, CurrentUserId, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("{conversationId}/messages")]
    public async Task<IActionResult> SendMessage(Guid conversationId, [FromBody] SendMessageRequest req, CancellationToken ct)
    {
        var command = new SendMessageCommand(conversationId, CurrentUserId, req.Type, req.Content, req.FileUrl, req.FileName, req.FileSize, req.ReplyToMessageId);
        var result = await mediator.Send(command, ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", result.Value, ct);
        return Ok(result.Value);
    }

    [HttpPost("{conversationId}/messages/upload")]
    public async Task<IActionResult> UploadAndSend(Guid conversationId, IFormFile file, [FromQuery] MessageType type = MessageType.File, CancellationToken ct = default)
    {
        if (file.Length == 0) return BadRequest("File is empty.");

        using var stream = file.OpenReadStream();
        var objectName = await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);
        var fileUrl = storage.GetPublicUrl(objectName);

        var command = new SendMessageCommand(conversationId, CurrentUserId, type, null, fileUrl, file.FileName, file.Length, null);
        var result = await mediator.Send(command, ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", result.Value, ct);
        return Ok(result.Value);
    }

    [HttpDelete("{conversationId}/messages/{messageId}")]
    public async Task<IActionResult> RecallMessage(Guid conversationId, Guid messageId, CancellationToken ct)
    {
        var result = await mediator.Send(new RecallMessageCommand(messageId, CurrentUserId), ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await hub.Clients.Group(conversationId.ToString()).SendAsync("MessageRecalled", messageId, ct);
        return Ok();
    }
}

public record GetOrCreateDirectRequest(Guid OtherUserId);
public record CreateGroupRequest(string Name, List<Guid> MemberIds);
public record SendMessageRequest(MessageType Type, string? Content, string? FileUrl, string? FileName, long? FileSize, Guid? ReplyToMessageId);
