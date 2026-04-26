using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record DeleteForMeCommand(Guid MessageId, Guid ConversationId, Guid RequesterId) : IRequest<Result>;

public class DeleteForMeCommandHandler(
    IMessageRepository messages,
    IConversationRepository conversations,
    IUnitOfWork uow) : IRequestHandler<DeleteForMeCommand, Result>
{
    public async Task<Result> Handle(DeleteForMeCommand req, CancellationToken ct)
    {
        var member = await conversations.GetMemberAsync(req.ConversationId, req.RequesterId, ct);
        if (member is null) return Result.Failure("Not a member of this conversation.");

        var message = await messages.GetByIdAsync(req.MessageId, ct);
        if (message is null) return Result.Failure("Message not found.");
        if (message.ConversationId != req.ConversationId) return Result.Failure("Message not in this conversation.");

        if (await messages.IsDeletedForUserAsync(req.MessageId, req.RequesterId, ct))
            return Result.Success(); // idempotent

        var deletion = MessageDeletion.Create(req.MessageId, req.RequesterId);
        await messages.AddDeletionForMeAsync(deletion, ct);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
