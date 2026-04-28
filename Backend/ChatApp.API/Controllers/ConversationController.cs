using ChatApp.Application.Features.Conversations;
using ChatApp.Application.Features.Messages;
using ChatApp.Application.Interfaces;
using ChatApp.Application.DTOs;
using ChatApp.API.Hubs;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Controllers;

[Route("api/conversations")]
public class ConversationController(
    IMediator mediator,
    IStorageService storage,
    IHubContext<ChatHub> hub,
    IConversationRepository convRepo,
    IMessageRepository msgRepo,
    IUserRepository userRepo,
    IUnitOfWork uow) : BaseController
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
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        var dto = result.Value;
        foreach (var member in dto.Members.Where(m => m.UserId != CurrentUserId))
            await hub.Clients.Group($"user-{member.UserId}").SendAsync("GroupCreated", dto, ct);

        return Ok(dto);
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

        await hub.Clients.Group(conversationId.ToString()).SendAsync("MessageRecalled", messageId, conversationId, ct);
        return Ok();
    }

    [HttpDelete("{conversationId}/messages/{messageId}/permanent")]
    public async Task<IActionResult> DeleteMessage(Guid conversationId, Guid messageId, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteMessageCommand(messageId, CurrentUserId), ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await hub.Clients.Group(conversationId.ToString()).SendAsync("MessageDeleted", messageId, conversationId, ct);
        return Ok();
    }

    [HttpDelete("{conversationId}/messages/{messageId}/for-me")]
    public async Task<IActionResult> DeleteForMe(Guid conversationId, Guid messageId, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteForMeCommand(messageId, conversationId, CurrentUserId), ct);
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPost("{conversationId}/messages/{messageId}/forward")]
    public async Task<IActionResult> ForwardMessage(Guid conversationId, Guid messageId, [FromBody] ForwardMessageRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ForwardMessageCommand(messageId, req.TargetConversationId, CurrentUserId), ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await hub.Clients.Group(req.TargetConversationId.ToString()).SendAsync("ReceiveMessage", result.Value, ct);
        return Ok(result.Value);
    }

    [HttpPut("{conversationId}/messages/{messageId}/pin")]
    public async Task<IActionResult> TogglePinMessage(Guid conversationId, Guid messageId, CancellationToken ct)
    {
        var result = await mediator.Send(new PinMessageCommand(messageId, conversationId, CurrentUserId), ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        var isPinned = result.Value;
        var eventName = isPinned ? "MessagePinned" : "MessageUnpinned";
        await hub.Clients.Group(conversationId.ToString()).SendAsync(eventName, messageId, conversationId, ct);
        return Ok(new { isPinned });
    }

    [HttpPost("{conversationId}/messages/{messageId}/react")]
    public async Task<IActionResult> ToggleReaction(Guid conversationId, Guid messageId, [FromBody] ToggleReactionRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ToggleReactionCommand(messageId, CurrentUserId, req.Emoji), ct);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReactionToggled",
            new { conversationId, messageId, userId = CurrentUserId, emoji = req.Emoji, added = result.Value }, ct);
        return Ok(new { added = result.Value });
    }

    [HttpPost("{conversationId}/avatar")]
    public async Task<IActionResult> UploadGroupAvatar(Guid conversationId, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("File is empty.");

        var member = await convRepo.GetMemberAsync(conversationId, CurrentUserId, ct);
        if (member is null) return Forbid();

        using var stream = file.OpenReadStream();
        var objectName = await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);
        var avatarUrl = storage.GetPublicUrl(objectName);

        var conv = await convRepo.GetByIdAsync(conversationId, ct);
        if (conv is null) return NotFound();
        conv.UpdateGroup(conv.Name ?? "", avatarUrl);
        convRepo.Update(conv);

        var actor = await userRepo.GetByIdAsync(CurrentUserId, ct);
        var sysMsg = await BroadcastSystemMessageAsync(conversationId,
            $"{actor?.DisplayName ?? "Someone"} updated the group photo", ct);

        await uow.SaveChangesAsync(ct);

        await hub.Clients.Group(conversationId.ToString()).SendAsync("GroupAvatarUpdated", conversationId, avatarUrl, ct);
        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", sysMsg, ct);
        return Ok(new { avatarUrl });
    }

    [HttpPut("{conversationId}/mute")]
    public async Task<IActionResult> MuteConversation(Guid conversationId, [FromBody] MuteConversationRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new MuteConversationCommand(conversationId, CurrentUserId, req.Mute), ct);
        return result.IsSuccess ? Ok() : BadRequest(new { error = result.Error });
    }

    [HttpPatch("{conversationId}/name")]
    public async Task<IActionResult> RenameGroup(Guid conversationId, [FromBody] RenameGroupRequest req, CancellationToken ct)
    {
        var member = await convRepo.GetMemberAsync(conversationId, CurrentUserId, ct);
        if (member is null || member.Role != MemberRole.Admin) return Forbid();

        var conv = await convRepo.GetByIdAsync(conversationId, ct);
        if (conv is null) return NotFound();
        conv.UpdateGroup(req.Name, conv.AvatarUrl);
        convRepo.Update(conv);

        var actor = await userRepo.GetByIdAsync(CurrentUserId, ct);
        var sysMsg = await BroadcastSystemMessageAsync(conversationId,
            $"{actor?.DisplayName ?? "Someone"} renamed the group to \"{req.Name}\"", ct);

        await uow.SaveChangesAsync(ct);

        await hub.Clients.Group(conversationId.ToString()).SendAsync("GroupRenamed", conversationId, req.Name, ct);
        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", sysMsg, ct);
        return Ok();
    }

    [HttpPost("{conversationId}/leave")]
    public async Task<IActionResult> LeaveGroup(Guid conversationId, CancellationToken ct)
    {
        var member = await convRepo.GetMemberAsync(conversationId, CurrentUserId, ct);
        if (member is null) return NotFound();

        convRepo.RemoveMember(member);

        var actor = await userRepo.GetByIdAsync(CurrentUserId, ct);
        var sysMsg = await BroadcastSystemMessageAsync(conversationId,
            $"{actor?.DisplayName ?? "Someone"} left the group", ct);

        await uow.SaveChangesAsync(ct);

        await hub.Clients.Group(conversationId.ToString()).SendAsync("MemberLeft", conversationId, CurrentUserId, ct);
        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", sysMsg, ct);
        return Ok();
    }

    [HttpDelete("{conversationId}/members/{userId}")]
    public async Task<IActionResult> KickMember(Guid conversationId, Guid userId, CancellationToken ct)
    {
        var requester = await convRepo.GetMemberAsync(conversationId, CurrentUserId, ct);
        if (requester is null || requester.Role != MemberRole.Admin) return Forbid();

        var target = await convRepo.GetMemberAsync(conversationId, userId, ct);
        if (target is null) return NotFound();

        convRepo.RemoveMember(target);

        var actor = await userRepo.GetByIdAsync(CurrentUserId, ct);
        var targetUser = await userRepo.GetByIdAsync(userId, ct);
        var sysMsg = await BroadcastSystemMessageAsync(conversationId,
            $"{actor?.DisplayName ?? "Admin"} removed {targetUser?.DisplayName ?? "a member"} from the group", ct);

        await uow.SaveChangesAsync(ct);

        await hub.Clients.Group(conversationId.ToString()).SendAsync("MemberKicked", conversationId, userId, ct);
        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", sysMsg, ct);
        return Ok();
    }

    [HttpPost("{conversationId}/members")]
    public async Task<IActionResult> AddMember(Guid conversationId, [FromBody] AddMemberRequest req, CancellationToken ct)
    {
        var requester = await convRepo.GetMemberAsync(conversationId, CurrentUserId, ct);
        if (requester is null || requester.Role != MemberRole.Admin) return Forbid();

        var existing = await convRepo.GetMemberAsync(conversationId, req.UserId, ct);
        if (existing is not null) return Conflict(new { error = "User already in group" });

        var newMember = ConversationMember.Create(conversationId, req.UserId);
        await convRepo.AddMemberAsync(newMember, ct);

        var actor = await userRepo.GetByIdAsync(CurrentUserId, ct);
        var addedUser = await userRepo.GetByIdAsync(req.UserId, ct);
        var sysMsg = await BroadcastSystemMessageAsync(conversationId,
            $"{actor?.DisplayName ?? "Admin"} added {addedUser?.DisplayName ?? "a member"} to the group", ct);

        await uow.SaveChangesAsync(ct);

        var convDto = await BuildConversationDtoAsync(conversationId, ct);
        await hub.Clients.Group(conversationId.ToString()).SendAsync("MemberAdded", conversationId, req.UserId, ct);
        await hub.Clients.Group($"user-{req.UserId}").SendAsync("GroupCreated", convDto, ct);
        await hub.Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", sysMsg, ct);
        return Ok();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private async Task<MessageDto> BroadcastSystemMessageAsync(Guid conversationId, string text, CancellationToken ct)
    {
        var msg = Message.CreateSystem(conversationId, text);
        await msgRepo.AddAsync(msg, ct);
        return new MessageDto(msg.Id, msg.ConversationId, null, "", null,
            MessageType.System, msg.Content, null, null, null, null, false, false, [], msg.CreatedAt);
    }

    private async Task<ConversationDto> BuildConversationDtoAsync(Guid conversationId, CancellationToken ct)
    {
        var conv = await convRepo.GetByIdAsync(conversationId, ct);
        var members = conv!.Members.Select(m => new ConversationMemberDto(
            m.UserId, m.User.DisplayName, m.User.AvatarUrl, m.Role, m.User.Status)).ToList();
        // This is typically used for group operations, so IsColleague is false
        return new ConversationDto(conv.Id, conv.Name, conv.AvatarUrl,
            conv.Type, members, null, 0, conv.CreatedAt, false, false, null);
    }
}

public record GetOrCreateDirectRequest(Guid OtherUserId);
public record CreateGroupRequest(string Name, List<Guid> MemberIds);
public record SendMessageRequest(MessageType Type, string? Content, string? FileUrl, string? FileName, long? FileSize, Guid? ReplyToMessageId);
public record ToggleReactionRequest(string Emoji);
public record MuteConversationRequest(bool Mute);
public record RenameGroupRequest(string Name);
public record AddMemberRequest(Guid UserId);
public record ForwardMessageRequest(Guid TargetConversationId);
