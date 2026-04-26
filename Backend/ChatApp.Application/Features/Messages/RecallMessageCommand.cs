using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record RecallMessageCommand(Guid MessageId, Guid RequesterId) : IRequest<Result>;

public class RecallMessageCommandHandler(IMessageRepository messages, IUnitOfWork uow)
    : IRequestHandler<RecallMessageCommand, Result>
{
    public async Task<Result> Handle(RecallMessageCommand req, CancellationToken ct)
    {
        var message = await messages.GetByIdAsync(req.MessageId, ct);
        if (message is null) return Result.Failure("Message not found.");
        if (message.SenderId != req.RequesterId) return Result.Failure("Cannot recall another user's message.");
        if (message.IsRecalled) return Result.Failure("Message already recalled.");

        var recallTimeLimit = TimeSpan.FromMinutes(30);
        if (!message.CanRecall(recallTimeLimit))
            return Result.Failure("Cannot recall message after 30 minutes.");

        message.Recall();
        messages.Update(message);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
