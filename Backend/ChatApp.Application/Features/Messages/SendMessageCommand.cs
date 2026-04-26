using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record SendMessageCommand(
    Guid ConversationId,
    Guid SenderId,
    MessageType Type,
    string? Content,
    string? FileUrl,
    string? FileName,
    long? FileSize,
    Guid? ReplyToMessageId
) : IRequest<Result<MessageDto>>;

public class SendMessageCommandHandler(
    IMessageRepository messages,
    IConversationRepository conversations,
    IUserRepository users,
    IBlockedUserRepository blockedUsers,
    IUnitOfWork uow)
    : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    public async Task<Result<MessageDto>> Handle(SendMessageCommand req, CancellationToken ct)
    {
        var member = await conversations.GetMemberAsync(req.ConversationId, req.SenderId, ct);
        if (member is null)
            return Result<MessageDto>.Failure("Not a member of this conversation.");

        // Check if this is a 1-on-1 conversation and if either user has blocked the other
        var conversation = await conversations.GetByIdAsync(req.ConversationId, ct);
        if (conversation is not null && conversation.Type == Domain.Enums.ConversationType.Direct)
        {
            // Get the other user in the conversation
            var allMemberIds = await conversations.GetMemberIdsAsync(req.ConversationId, ct);
            var otherUserId = allMemberIds.FirstOrDefault(id => id != req.SenderId);

            if (otherUserId != Guid.Empty)
            {
                // Check if sender has blocked the other user
                var senderBlockedOther = await blockedUsers.GetBlockAsync(req.SenderId, otherUserId, ct);
                if (senderBlockedOther is not null)
                    return Result<MessageDto>.Failure("You have blocked this user.");

                // Check if other user has blocked the sender
                var otherBlockedSender = await blockedUsers.GetBlockAsync(otherUserId, req.SenderId, ct);
                if (otherBlockedSender is not null)
                    return Result<MessageDto>.Failure("This user has blocked you.");
            }
        }

        Message message;
        if (req.Type == MessageType.Text)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                return Result<MessageDto>.Failure("Content is required for text messages.");
            message = Message.CreateText(req.ConversationId, req.SenderId, req.Content!, req.ReplyToMessageId);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(req.FileUrl))
                return Result<MessageDto>.Failure("FileUrl is required for file/image messages.");
            message = Message.CreateFile(req.ConversationId, req.SenderId, req.FileUrl!, req.FileName!, req.FileSize ?? 0, req.Type);
        }

        await messages.AddAsync(message, ct);
        await uow.SaveChangesAsync(ct);

        var sender = await users.GetByIdAsync(req.SenderId, ct);
        Message? replyToMessage = req.ReplyToMessageId.HasValue
            ? await messages.GetByIdAsync(req.ReplyToMessageId.Value, ct)
            : null;
        Domain.Entities.User? replyToSender = replyToMessage?.SenderId.HasValue == true
            ? await users.GetByIdAsync(replyToMessage.SenderId!.Value, ct)
            : null;

        var dto = MapToDto(message, sender, replyToMessage, replyToSender);
        return Result<MessageDto>.Success(dto);
    }

    private static MessageDto MapToDto(
        Message m,
        Domain.Entities.User? sender,
        Message? replyToMessage = null,
        Domain.Entities.User? replyToSender = null) => new(
        m.Id, m.ConversationId, m.SenderId,
        sender?.DisplayName ?? "Unknown", sender?.AvatarUrl,
        m.Type, m.Content, m.FileUrl, m.FileName, m.FileSize,
        m.ReplyToMessageId, m.IsRecalled, m.IsPinned,
        [], m.CreatedAt)
    {
        ReplyToSenderName = replyToSender?.DisplayName,
        ReplyToContent = replyToMessage?.IsRecalled == true ? null : (replyToMessage?.Content ?? replyToMessage?.FileUrl),
        ReplyToType = replyToMessage?.Type
    };
}
