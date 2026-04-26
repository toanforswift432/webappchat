using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record DeleteMessageCommand(Guid MessageId, Guid RequesterId) : IRequest<Result>;

public class DeleteMessageCommandHandler(IMessageRepository messages, IUnitOfWork uow)
    : IRequestHandler<DeleteMessageCommand, Result>
{
    public async Task<Result> Handle(DeleteMessageCommand req, CancellationToken ct)
    {
        var message = await messages.GetByIdAsync(req.MessageId, ct);
        if (message is null) return Result.Failure("Message not found.");
        if (message.SenderId != req.RequesterId) return Result.Failure("Cannot delete another user's message.");

        var deleteTimeLimit = TimeSpan.FromMinutes(3);
        if (!message.CanDelete(deleteTimeLimit))
            return Result.Failure("Cannot delete message after 3 minutes.");

        messages.Delete(message);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
