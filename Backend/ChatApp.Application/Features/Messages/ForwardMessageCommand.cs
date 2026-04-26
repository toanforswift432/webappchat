using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record ForwardMessageCommand(
    Guid MessageId,
    Guid TargetConversationId,
    Guid ForwardedBySenderId
) : IRequest<Result<MessageDto>>;

public class ForwardMessageCommandHandler(
    IMessageRepository messages,
    IConversationRepository conversations,
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<ForwardMessageCommand, Result<MessageDto>>
{
    public async Task<Result<MessageDto>> Handle(ForwardMessageCommand req, CancellationToken ct)
    {
        // Check if original message exists
        var originalMessage = await messages.GetByIdAsync(req.MessageId, ct);
        if (originalMessage is null)
            return Result<MessageDto>.Failure("Original message not found.");

        if (originalMessage.IsRecalled)
            return Result<MessageDto>.Failure("Cannot forward recalled message.");

        // Check if user is member of target conversation
        var member = await conversations.GetMemberAsync(req.TargetConversationId, req.ForwardedBySenderId, ct);
        if (member is null)
            return Result<MessageDto>.Failure("Not a member of target conversation.");

        // Create forwarded message
        var forwardedMessage = Domain.Entities.Message.CreateForwarded(
            req.TargetConversationId,
            req.ForwardedBySenderId,
            originalMessage
        );

        await messages.AddAsync(forwardedMessage, ct);
        await uow.SaveChangesAsync(ct);

        // Get sender info
        var sender = await users.GetByIdAsync(req.ForwardedBySenderId, ct);
        var originalSender = originalMessage.SenderId.HasValue
            ? await users.GetByIdAsync(originalMessage.SenderId.Value, ct)
            : null;

        var dto = MapToDto(forwardedMessage, sender!, originalSender);
        return Result<MessageDto>.Success(dto);
    }

    private static MessageDto MapToDto(Domain.Entities.Message m, Domain.Entities.User sender, Domain.Entities.User? originalSender)
    {
        return new MessageDto(
            m.Id, m.ConversationId, m.SenderId,
            sender.DisplayName, sender.AvatarUrl,
            m.Type, m.Content, m.FileUrl, m.FileName, m.FileSize,
            m.ReplyToMessageId, m.IsRecalled, m.IsPinned,
            [], m.CreatedAt
        )
        {
            IsForwarded = m.IsForwarded,
            ForwardedFromMessageId = m.ForwardedFromMessageId,
            OriginalSenderName = originalSender?.DisplayName
        };
    }
}
