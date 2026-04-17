using ChatApp.Application.Features.Messages;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ChatApp.API.Hubs;

[Authorize]
public class ChatHub(
    IMediator mediator,
    IRedisService redis,
    IConversationRepository conversations,
    IUserRepository users,
    ICallRepository calls,
    IUnitOfWork uow) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId != Guid.Empty)
        {
            await redis.SetUserOnlineAsync(userId);

            // Update status in DB so REST queries reflect online state
            var user = await users.GetByIdAsync(userId);
            if (user is not null)
            {
                user.SetStatus(OnlineStatus.Online);
                users.Update(user);
                await uow.SaveChangesAsync();
            }

            // Join all conversation groups
            var convs = await conversations.GetByUserIdAsync(userId);
            foreach (var conv in convs)
                await Groups.AddToGroupAsync(Context.ConnectionId, conv.Id.ToString());

            await Clients.Others.SendAsync("UserOnline", userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId != Guid.Empty)
        {
            await redis.SetUserOfflineAsync(userId);

            // Update status in DB
            var user = await users.GetByIdAsync(userId);
            if (user is not null)
            {
                user.SetStatus(OnlineStatus.Offline);
                users.Update(user);
                await uow.SaveChangesAsync();
            }

            await Clients.Others.SendAsync("UserOffline", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(Guid conversationId, string content, Guid? replyToMessageId = null)
    {
        var senderId = GetUserId();
        var command = new SendMessageCommand(conversationId, senderId, MessageType.Text, content, null, null, null, replyToMessageId);
        var result = await mediator.Send(command);

        if (result.IsSuccess)
            await Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", result.Value);
    }

    public async Task JoinConversation(Guid conversationId)
    {
        var userId = GetUserId();
        var member = await conversations.GetMemberAsync(conversationId, userId);
        if (member is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, conversationId.ToString());
    }

    public async Task MarkRead(Guid conversationId)
    {
        var userId = GetUserId();
        var member = await conversations.GetMemberAsync(conversationId, userId);
        if (member is not null)
        {
            member.MarkRead();
            await uow.SaveChangesAsync();
            await Clients.Group(conversationId.ToString()).SendAsync("MessagesRead", new { conversationId, userId });
        }
    }

    // Send 3 separate args so frontend destructuring works: (convId, userId, isTyping)
    public async Task Typing(Guid conversationId, bool isTyping)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("UserTyping", conversationId, userId, isTyping);
    }

    // ==================== WebRTC Signaling Methods ====================

    public async Task InitiateCall(Guid conversationId, string callType, string offer)
    {
        var userId = GetUserId();

        // Check if there's already an active call and end it
        var existingCall = await calls.GetActiveCallByConversationIdAsync(conversationId);
        if (existingCall is not null)
        {
            // Auto-end the existing call
            existingCall.End();
            calls.Update(existingCall);

            // Notify others that the old call ended
            await Clients.Group(conversationId.ToString())
                .SendAsync("CallEnded", existingCall.Id.ToString(), Guid.Empty);
        }

        // Create call record
        var type = callType.ToLower() == "video" ? CallType.Video : CallType.Audio;
        var call = Call.Create(conversationId, userId, type);
        call.SetRinging();
        await calls.AddAsync(call);

        // Add initiator as participant
        var participant = CallParticipant.Create(call.Id, userId);
        await calls.AddParticipantAsync(participant);
        await uow.SaveChangesAsync();

        // Send callId back to caller
        await Clients.Caller.SendAsync("CallInitiated", call.Id.ToString(), conversationId);

        // Notify other members in the conversation
        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("IncomingCall", call.Id.ToString(), conversationId, userId, callType, offer);
    }

    public async Task AnswerCall(string callId, Guid conversationId, string answer)
    {
        var userId = GetUserId();

        if (!Guid.TryParse(callId, out var callGuid))
            return;

        var call = await calls.GetByIdAsync(callGuid);
        if (call is null)
            return;

        // Add answerer as participant
        var participant = CallParticipant.Create(callGuid, userId);
        await calls.AddParticipantAsync(participant);

        // Update call status to active
        call.Start();
        calls.Update(call);
        await uow.SaveChangesAsync();

        // Send answer to initiator and others
        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("CallAnswered", callId, userId, answer);
    }

    public async Task RejectCall(string callId, Guid conversationId)
    {
        var userId = GetUserId();

        if (!Guid.TryParse(callId, out var callGuid))
            return;

        var call = await calls.GetByIdAsync(callGuid);
        if (call is not null)
        {
            call.Reject();
            calls.Update(call);
            await uow.SaveChangesAsync();
        }

        await Clients.Group(conversationId.ToString())
            .SendAsync("CallRejected", callId, userId);
    }

    public async Task EndCall(string callId, Guid conversationId)
    {
        var userId = GetUserId();

        if (!Guid.TryParse(callId, out var callGuid))
            return;

        var call = await calls.GetByIdAsync(callGuid);
        if (call is not null)
        {
            call.End();

            // Mark participants as left
            var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
            participant?.Leave();

            calls.Update(call);
            await uow.SaveChangesAsync();
        }

        await Clients.Group(conversationId.ToString())
            .SendAsync("CallEnded", callId, userId);
    }

    public async Task SendIceCandidate(Guid conversationId, string candidate)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("IceCandidate", userId, candidate);
    }

    public async Task ToggleMedia(Guid conversationId, string callId, string mediaType, bool enabled)
    {
        var userId = GetUserId();

        if (Guid.TryParse(callId, out var callGuid))
        {
            var call = await calls.GetByIdAsync(callGuid);
            if (call is not null)
            {
                var participant = call.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant is not null)
                {
                    if (mediaType.ToLower() == "video")
                        participant.ToggleVideo(enabled);
                    else if (mediaType.ToLower() == "audio")
                        participant.ToggleAudio(enabled);

                    await uow.SaveChangesAsync();
                }
            }
        }

        await Clients.OthersInGroup(conversationId.ToString())
            .SendAsync("MediaToggled", userId, mediaType, enabled);
    }

    private Guid GetUserId()
    {
        var sub = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? Context.User?.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
